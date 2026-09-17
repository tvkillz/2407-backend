const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const logger = require('../config/logger');

function sanitizeSegment(value, fallback = '') {
	const cleaned = String(value || '')
		.replace(/[^a-zA-Z0-9._-]/g, '-')
		.replace(/^\.+/, '');
	return cleaned || fallback;
}

function resolveStoredPath(folder, filename) {
	const baseDir = process.env.FILE_STORAGE_UPLOAD_DIR || 'uploads';
	const safeFolder = sanitizeSegment(folder, 'uncategorized');
	const safeFilename = sanitizeSegment(filename);
	if (!safeFilename) {
		return null;
	}
	return {
		folder: safeFolder,
		filename: safeFilename,
		filePath: path.join(__dirname, '..', '..', baseDir, safeFolder, safeFilename),
		dirPath: path.join(__dirname, '..', '..', baseDir, safeFolder),
	};
}

function getMimeType(ext) {
	const mimeTypes = {
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.gif': 'image/gif',
		'.webp': 'image/webp',
		'.pdf': 'application/pdf',
		'.doc': 'application/msword',
		'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'.xls': 'application/vnd.ms-excel',
		'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'.zip': 'application/zip',
		'.txt': 'text/plain',
	};

	return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

const uploadFile = (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded' });
	}

	const folder = sanitizeSegment(req.params.folder, 'uncategorized');
	const filetype = path.extname(req.file.originalname).replace('.', '') || '';

	logger.info('File uploaded successfully', {
		filename: req.file.filename,
		originalname: req.file.originalname,
		size: req.file.size,
		folder,
		filetype,
	});

	res.json({
		message: 'File uploaded successfully',
		filename: req.file.filename,
		originalname: req.file.originalname,
		filetype,
		file: req.file.filename,
		folder,
		size: req.file.size,
		mimetype: req.file.mimetype,
	});
};

const getFile = (req, res) => {
	const resolved = resolveStoredPath(req.params.folder, req.params.filename);
	if (!resolved) {
		return res.status(400).json({ error: 'Invalid filename' });
	}

	if (!fsSync.existsSync(resolved.filePath)) {
		logger.error('File not found', { filename: resolved.filename, folder: resolved.folder });
		return res.status(404).json({ error: 'File not found' });
	}

	res.setHeader('Content-Type', getMimeType(path.extname(resolved.filename)));
	res.sendFile(path.resolve(resolved.filePath));
};

const deleteFile = async (req, res) => {
	const resolved = resolveStoredPath(req.params.folder, req.params.filename);
	if (!resolved) {
		return res.status(400).json({ error: 'Invalid filename' });
	}

	if (!fsSync.existsSync(resolved.filePath)) {
		logger.error('File not found for deletion', { filename: resolved.filename, folder: resolved.folder });
		return res.status(404).json({ error: 'File not found' });
	}

	try {
		await fs.unlink(resolved.filePath);
		logger.info('File deleted successfully', { filename: resolved.filename, folder: resolved.folder });
		res.json({
			message: 'File deleted successfully',
			filename: resolved.filename,
			folder: resolved.folder,
		});
	} catch (error) {
		logger.error('Error deleting file', { filename: resolved.filename, folder: resolved.folder, error: error.message });
		res.status(500).json({ error: 'Error deleting file' });
	}
};

const createFolder = async (req, res) => {
	const folder = sanitizeSegment(req.params.folder);
	if (!folder) {
		return res.status(400).json({ error: 'Folder name is required' });
	}

	try {
		const folderPath = path.join(__dirname, '..', '..', process.env.FILE_STORAGE_UPLOAD_DIR || 'uploads', folder);

		if (fsSync.existsSync(folderPath)) {
			logger.info('Folder already exists', { folder });
			return res.json({
				message: 'Folder already exists',
				folder,
				created: false,
			});
		}

		await fs.mkdir(folderPath, { recursive: true });
		logger.info('Folder created successfully', { folder });

		res.json({
			message: 'Folder created successfully',
			folder,
			created: true,
		});
	} catch (error) {
		logger.error('Error creating folder', { folder, error: error.message });
		res.status(500).json({ error: 'Error creating folder' });
	}
};

module.exports = {
	uploadFile,
	getFile,
	deleteFile,
	createFolder,
};
