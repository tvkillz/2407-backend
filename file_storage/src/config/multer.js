const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

function sanitizeFolder(folder) {
	return String(folder || 'uncategorized')
		.replace(/[^a-zA-Z0-9._-]/g, '-')
		.replace(/^\.+/, '')
		.slice(0, 120) || 'uncategorized';
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const baseDir = process.env.FILE_STORAGE_UPLOAD_DIR || 'uploads';
		const folder = sanitizeFolder(req.params.folder);
		req.params.folder = folder;
		const uploadDir = path.join(baseDir, folder);

		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueId = uuidv4();
		const ext = path.extname(file.originalname).slice(0, 16);
		cb(null, `${uniqueId}${ext}`);
	},
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: parseInt(process.env.FILE_STORAGE_MAX_SIZE, 10) || 25 * 1024 * 1024,
	},
});

module.exports = upload;
