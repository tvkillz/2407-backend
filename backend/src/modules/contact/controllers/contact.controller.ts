import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';
import { FileStorageService } from '../../../services/file-storage.service';

export class ContactController {
	static async create(req: Request, res: Response): Promise<void> {
		try {
			const files = (req.files as Express.Multer.File[]) || [];
			const contact = await ContactService.create({
				body: req.body,
				files,
				ip: req.ip,
			});

			res.status(201).json({ ok: true, id: contact.id });
		} catch (error) {
			res.status(400).json({ error: (error as Error).message });
		}
	}

	static async list(req: Request, res: Response): Promise<void> {
		try {
			const page = parseInt(String(req.query.page || '1'), 10);
			const limit = parseInt(String(req.query.limit || '20'), 10);
			const name =
				typeof req.query.name === 'string'
					? req.query.name
					: typeof req.query['name[$regex]'] === 'string'
						? String(req.query['name[$regex]'])
						: undefined;
			const email =
				typeof req.query.email === 'string'
					? req.query.email
					: typeof req.query['email[$regex]'] === 'string'
						? String(req.query['email[$regex]'])
						: undefined;
			const formType = typeof req.query.formType === 'string' ? req.query.formType : undefined;
			const result = await ContactService.list(page, limit, { name, email, formType });
			res.json(result);
		} catch (error) {
			res.status(400).json({ error: (error as Error).message });
		}
	}

	static async getById(req: Request, res: Response): Promise<void> {
		try {
			const contact = await ContactService.getById(req.params.id);
			if (!contact) {
				res.status(404).json({ error: 'Contact not found' });
				return;
			}
			res.json(contact);
		} catch (error) {
			res.status(400).json({ error: (error as Error).message });
		}
	}

	static async getFile(req: Request, res: Response): Promise<void> {
		try {
			const contact = await ContactService.getById(req.params.id);
			if (!contact) {
				res.status(404).json({ error: 'Contact not found' });
				return;
			}

			const stored = contact.files.find((file) => file.filename === req.params.filename);
			if (!stored) {
				res.status(404).json({ error: 'File not found' });
				return;
			}

			const file = await FileStorageService.getFile(stored.folder, stored.filename);
			res.setHeader('Content-Type', file.contentType);
			res.setHeader('Content-Disposition', `inline; filename="${stored.originalname}"`);
			res.send(file.data);
		} catch (error) {
			const message = (error as Error).message;
			res.status(message === 'File not found' ? 404 : 400).json({ error: message });
		}
	}

	static async update(req: Request, res: Response): Promise<void> {
		try {
			const contact = await ContactService.update(req.params.id, req.body);
			if (!contact) {
				res.status(404).json({ error: 'Submission not found' });
				return;
			}
			res.json(contact);
		} catch (error) {
			res.status(400).json({ error: (error as Error).message });
		}
	}

	static async remove(req: Request, res: Response): Promise<void> {
		try {
			const contact = await ContactService.delete(req.params.id);
			if (!contact) {
				res.status(404).json({ error: 'Submission not found' });
				return;
			}
			res.json({ ok: true, id: req.params.id });
		} catch (error) {
			res.status(400).json({ error: (error as Error).message });
		}
	}
}
