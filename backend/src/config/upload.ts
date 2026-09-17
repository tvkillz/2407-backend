import multer from 'multer';

export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '', 10) || 25 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = new Set([
	'.pdf',
	'.doc',
	'.docx',
	'.xls',
	'.xlsx',
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.txt',
	'.zip',
]);

export const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: MAX_FILE_SIZE,
		files: 10,
	},
});
