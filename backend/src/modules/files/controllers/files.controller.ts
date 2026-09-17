import path from 'path';
import { Request, Response } from 'express';
import { FileStorageService } from '../../../services/file-storage.service';
import { ALLOWED_EXTENSIONS } from '../../../config/upload';

function sanitizeFolder(folder: string): string {
	return folder.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^\.+/, '').slice(0, 120);
}

export class FilesController {
	static async upload(req: Request, res: Response): Promise<void> {
		try {
			const file = req.file;
			if (!file) {
				res.status(400).json({ error: 'No file uploaded' });
				return;
			}

			const ext = path.extname(file.originalname).toLowerCase();
			if (!ALLOWED_EXTENSIONS.has(ext)) {
				res.status(400).json({ error: `File type not allowed: ${file.originalname}` });
				return;
			}

			const folder = sanitizeFolder(req.params.folder || 'uploads');
			if (!folder) {
				res.status(400).json({ error: 'Folder is required' });
				return;
			}

			await FileStorageService.createFolder(folder);
			const uploaded = await FileStorageService.uploadFile(file, folder);
			res.status(201).json(uploaded);
		} catch (error) {
			res.status(400).json({ error: (error as Error).message });
		}
	}

	static async get(req: Request, res: Response): Promise<void> {
		try {
			const folder = sanitizeFolder(req.params.folder);
			const filename = req.params.filename;
			const file = await FileStorageService.getFile(folder, filename);
			res.setHeader('Content-Type', file.contentType);
			res.send(file.data);
		} catch (error) {
			const message = (error as Error).message;
			res.status(message === 'File not found' ? 404 : 400).json({ error: message });
		}
	}

	static async remove(req: Request, res: Response): Promise<void> {
		try {
			const folder = sanitizeFolder(req.params.folder);
			await FileStorageService.deleteFile(folder, req.params.filename);
			res.json({ ok: true });
		} catch (error) {
			const message = (error as Error).message;
			res.status(message === 'File not found' ? 404 : 400).json({ error: message });
		}
	}
}
