import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import connectDB from './config/db';
import logger from './config/logger';
import contactRoutes from './modules/contact/routes/contact.routes';
import submissionsRoutes from './modules/submissions/routes/submissions.routes';
import authRoutes from './modules/auth/routes/auth.routes';
import filesRoutes from './modules/files/routes/files.routes';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

connectDB();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

app.set('trust proxy', 1);

app.use(
	cors({
		origin: allowedOrigins.length ? allowedOrigins : true,
	})
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
	res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/files', filesRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			res.status(413).json({ error: 'File too large (max 25 MB)' });
			return;
		}
		res.status(400).json({ error: err.message });
		return;
	}

	logger.error('Unhandled error', { error: err.message });
	res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
	logger.info(`2407 backend listening on port ${port}`);
});
