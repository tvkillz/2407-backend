const nodemailer = require('nodemailer');
const { getSmtpConfig } = require('./env');
const logger = require('./logger');

/**
 * Office 365 / Exchange Online: smtp.office365.com:587 STARTTLS.
 * Do not force SSLv3 ciphers — Microsoft requires TLS 1.2+.
 */
const createTransporter = () => {
	const { host, user, pass, port } = getSmtpConfig();
	const config = {
		host,
		port,
		secure: port === 465,
		requireTLS: port === 587,
		auth: {
			user,
			pass,
		},
		tls: {
			minVersion: 'TLSv1.2',
		},
		connectionTimeout: 60000,
		greetingTimeout: 30000,
		socketTimeout: 60000,
		logger: process.env.NODE_ENV === 'development',
		debug: process.env.NODE_ENV === 'development',
	};

	logger.info('SMTP config', {
		host: config.host,
		port: config.port,
		user: config.auth.user,
		secure: config.secure,
		requireTLS: config.requireTLS,
	});

	return nodemailer.createTransport(config);
};

module.exports = {
	createTransporter,
};
