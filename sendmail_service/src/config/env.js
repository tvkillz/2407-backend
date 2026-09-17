function getSmtpConfig() {
	const host = process.env.SMTP_HOST;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASSWORD;
	const port = parseInt(process.env.SMTP_PORT, 10) || 587;
	const from = process.env.SMTP_FROM || user;
	const fromName = process.env.SMTP_FROM_NAME || '2407';

	if (!host || !user || !pass) {
		throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASSWORD are required');
	}

	return { host, user, pass, port, from, fromName };
}

function assertEnv() {
	getSmtpConfig();
}

module.exports = {
	getSmtpConfig,
	assertEnv,
};
