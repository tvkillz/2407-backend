import { Schema, model, Document } from 'mongoose';

export interface IStoredFile {
	filename: string;
	originalname: string;
	folder: string;
	size: number;
	mimetype: string;
}

export type ContactFormType = 'contact' | 'seminar';

export interface IContact extends Document {
	formType: ContactFormType;
	name?: string;
	email: string;
	phone?: string;
	company?: string;
	message?: string;
	thema?: string;
	beschreibung?: string;
	dauer?: string;
	datum?: string;
	format?: string;
	ansprechpartner?: string;
	privacyConsent: boolean;
	privacyConsentAt: Date;
	files: IStoredFile[];
	status: 'new' | 'read' | 'archived';
	source: string;
	ip?: string;
	createdAt: Date;
	updatedAt: Date;
}

const StoredFileSchema = new Schema<IStoredFile>(
	{
		filename: { type: String, required: true },
		originalname: { type: String, required: true },
		folder: { type: String, required: true },
		size: { type: Number, required: true },
		mimetype: { type: String, required: true },
	},
	{ _id: false }
);

const ContactSchema = new Schema<IContact>(
	{
		formType: { type: String, enum: ['contact', 'seminar'], required: true, default: 'contact' },
		name: { type: String, required: false, trim: true, maxlength: 200 },
		email: { type: String, required: true, trim: true, lowercase: true, maxlength: 320 },
		phone: { type: String, required: false, trim: true, maxlength: 50 },
		company: { type: String, required: false, trim: true, maxlength: 200 },
		message: { type: String, required: false, trim: true, maxlength: 10000 },
		thema: { type: String, required: false, trim: true, maxlength: 500 },
		beschreibung: { type: String, required: false, trim: true, maxlength: 10000 },
		dauer: { type: String, required: false, trim: true, maxlength: 200 },
		datum: { type: String, required: false, trim: true, maxlength: 200 },
		format: { type: String, required: false, trim: true, maxlength: 200 },
		ansprechpartner: { type: String, required: false, trim: true, maxlength: 200 },
		privacyConsent: { type: Boolean, required: true },
		privacyConsentAt: { type: Date, required: true },
		files: { type: [StoredFileSchema], default: [] },
		status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
		source: { type: String, default: '2407.services' },
		ip: { type: String, required: false },
	},
	{
		timestamps: true,
	}
);

ContactSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: (_doc, ret) => {
		ret.id = String(ret._id);
		return ret;
	},
});

export const ContactModel = model<IContact>('Contact', ContactSchema);
