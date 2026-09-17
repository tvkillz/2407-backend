import path from 'path';
import { ContactFormType, ContactModel, IStoredFile } from '../models/Contact.model';
import { FileStorageService } from '../../../services/file-storage.service';
import { EmailService } from '../../../services/email.service';
import { ALLOWED_EXTENSIONS } from '../../../config/upload';
import { asOptionalString, isTruthyConsent, isValidEmail } from '../validation';
import logger from '../../../config/logger';

function asFormType(value: unknown): ContactFormType {
	return asOptionalString(value) === 'seminar' ? 'seminar' : 'contact';
}

interface CreateContactInput {
	body: Record<string, unknown>;
	files: Express.Multer.File[];
	ip?: string;
}

export class ContactService {
	static async create(input: CreateContactInput) {
		const email = asOptionalString(input.body.email);
		if (!email || !isValidEmail(email)) {
			throw new Error('A valid email is required');
		}

		if (!isTruthyConsent(input.body.privacyConsent)) {
			throw new Error('Privacy consent is required');
		}

		for (const file of input.files) {
			const ext = path.extname(file.originalname).toLowerCase();
			if (!ALLOWED_EXTENSIONS.has(ext)) {
				throw new Error(`File type not allowed: ${file.originalname}`);
			}
		}

		const formType = asFormType(input.body.formType);
		const contact = await ContactModel.create({
			formType,
			name: asOptionalString(input.body.name),
			email,
			phone: asOptionalString(input.body.phone),
			company: asOptionalString(input.body.company),
			message: asOptionalString(input.body.message),
			thema: asOptionalString(input.body.thema),
			beschreibung: asOptionalString(input.body.beschreibung),
			dauer: asOptionalString(input.body.dauer),
			datum: asOptionalString(input.body.datum),
			format: asOptionalString(input.body.format),
			ansprechpartner: asOptionalString(input.body.ansprechpartner),
			privacyConsent: true,
			privacyConsentAt: new Date(),
			files: [],
			status: 'new',
			source: asOptionalString(input.body.source) || (formType === 'seminar' ? 'bildung' : '2407.services'),
			ip: input.ip,
		});

		const folder = `contact-${contact.id}`;
		const storedFiles: IStoredFile[] = [];

		try {
			if (input.files.length) {
				await FileStorageService.createFolder(folder);
				for (const file of input.files) {
					const uploaded = await FileStorageService.uploadFile(file, folder);
					storedFiles.push({
						filename: uploaded.filename,
						originalname: uploaded.originalname,
						folder: uploaded.folder,
						size: uploaded.size ?? file.size,
						mimetype: uploaded.mimetype ?? file.mimetype,
					});
				}
				contact.files = storedFiles;
				await contact.save();
			}
		} catch (error) {
			await ContactModel.findByIdAndDelete(contact.id);
			throw error;
		}

		const notifyTo = process.env.CONTACT_NOTIFY_TO;
		if (notifyTo) {
			const details = [
				contact.name && `<p><strong>Name:</strong> ${contact.name}</p>`,
				`<p><strong>Email:</strong> ${contact.email}</p>`,
				contact.phone && `<p><strong>Phone:</strong> ${contact.phone}</p>`,
				contact.company && `<p><strong>Company:</strong> ${contact.company}</p>`,
				contact.thema && `<p><strong>Thema:</strong> ${contact.thema}</p>`,
				contact.message && `<p><strong>Message:</strong><br>${contact.message}</p>`,
				contact.beschreibung && `<p><strong>Beschreibung:</strong><br>${contact.beschreibung}</p>`,
			]
				.filter(Boolean)
				.join('');

			EmailService.send({
				recipients: [notifyTo],
				replyTo: contact.email,
				subject: `New ${contact.formType} submission`,
				body: details || `<p>New ${contact.formType} submission from ${contact.email}</p>`,
			}).catch((error) => {
				logger.error('Contact notification email failed', { error, id: contact.id });
			});
		}

		return contact;
	}

	static async list(
		page = 1,
		limit = 20,
		filters: { name?: string; email?: string; formType?: string } = {}
	) {
		const safePage = Math.max(1, page);
		const safeLimit = Math.min(100, Math.max(1, limit));
		const skip = (safePage - 1) * safeLimit;

		const query: Record<string, unknown> = {};
		if (filters.name?.trim()) {
			query.name = { $regex: filters.name.trim(), $options: 'i' };
		}
		if (filters.email?.trim()) {
			query.email = { $regex: filters.email.trim(), $options: 'i' };
		}
		if (filters.formType === 'seminar' || filters.formType === 'contact') {
			query.formType = filters.formType;
		}

		const [items, total] = await Promise.all([
			ContactModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
			ContactModel.countDocuments(query),
		]);

		return {
			items,
			total,
			page: safePage,
			limit: safeLimit,
		};
	}

	static async getById(id: string) {
		return ContactModel.findById(id);
	}

	static async update(id: string, body: Record<string, unknown>) {
		const contact = await ContactModel.findById(id);
		if (!contact) {
			return null;
		}

		if (body.email !== undefined) {
			const email = asOptionalString(body.email);
			if (!email || !isValidEmail(email)) {
				throw new Error('A valid email is required');
			}
			contact.email = email;
		}

		if (body.name !== undefined) {
			contact.name = asOptionalString(body.name);
		}
		if (body.phone !== undefined) {
			contact.phone = asOptionalString(body.phone);
		}
		if (body.company !== undefined) {
			contact.company = asOptionalString(body.company);
		}
		if (body.message !== undefined) {
			contact.message = asOptionalString(body.message);
		}
		if (body.thema !== undefined) {
			contact.thema = asOptionalString(body.thema);
		}
		if (body.beschreibung !== undefined) {
			contact.beschreibung = asOptionalString(body.beschreibung);
		}
		if (body.dauer !== undefined) {
			contact.dauer = asOptionalString(body.dauer);
		}
		if (body.datum !== undefined) {
			contact.datum = asOptionalString(body.datum);
		}
		if (body.format !== undefined) {
			contact.format = asOptionalString(body.format);
		}
		if (body.ansprechpartner !== undefined) {
			contact.ansprechpartner = asOptionalString(body.ansprechpartner);
		}
		if (body.status !== undefined) {
			const status = asOptionalString(body.status);
			if (!status || !['new', 'read', 'archived'].includes(status)) {
				throw new Error('Invalid status');
			}
			contact.status = status as 'new' | 'read' | 'archived';
		}

		await contact.save();
		return contact;
	}

	static async delete(id: string) {
		const contact = await ContactModel.findById(id);
		if (!contact) {
			return null;
		}

		for (const file of contact.files) {
			try {
				await FileStorageService.deleteFile(file.folder, file.filename);
			} catch {
				// continue even if a stored file is already gone
			}
		}

		await ContactModel.findByIdAndDelete(id);
		return contact;
	}
}
