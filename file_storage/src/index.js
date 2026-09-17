const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fileRoutes = require('./routes/file-routes');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.FILE_STORAGE_PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ ok: true });
});

app.use('/', fileRoutes);

app.use((err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(413).json({ error: 'File too large' });
		}
		return res.status(400).json({ error: err.message });
	}

	logger.error('Error occurred', { error: err.message });
	res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
	logger.info(`File storage service running on port ${PORT}`);
});
