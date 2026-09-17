require('dotenv').config();

const express = require('express');
const cors = require('cors');
const emailRoutes = require('./routes/emailRoutes');
const { swaggerUi, specs } = require('./swagger/swagger');
const { assertEnv } = require('./config/env');
const logger = require('./config/logger');

assertEnv();

const app = express();
const PORT = process.env.PORT || 6001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
	logger.info(`${req.method} ${req.path}`, {
		ip: req.ip,
		userAgent: req.get('User-Agent'),
	});
	next();
});

app.use('/api/email', emailRoutes);

app.use(
	'/api-docs',
	swaggerUi.serve,
	swaggerUi.setup(specs, {
		explorer: true,
		customCss: '.swagger-ui .topbar { display: none }',
		customSiteTitle: '2407 Email Service API',
	})
);

app.get('/', (req, res) => {
	res.json({
		service: '2407 Email Service',
		version: '1.0.0',
		status: 'running',
		documentation: '/api-docs',
		endpoints: {
			sendEmail: 'POST /api/email/send',
			healthCheck: 'GET /api/email/health',
		},
	});
});

app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		service: '2407-sendmail',
	});
});

app.use((error, req, res, _next) => {
	logger.error('Unhandled error', {
		error: error.message,
		stack: error.stack,
		path: req.path,
		method: req.method,
	});

	res.status(500).json({
		success: false,
		message: 'Internal server error',
		error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
	});
});

app.use('*', (req, res) => {
	res.status(404).json({
		success: false,
		message: 'Endpoint not found',
		path: req.originalUrl,
	});
});

app.listen(PORT, '0.0.0.0', () => {
	logger.info(`2407 email service started on port ${PORT}`);
	logger.info(`API documentation available at /api-docs`);
});
