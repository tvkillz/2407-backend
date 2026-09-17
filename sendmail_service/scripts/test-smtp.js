require('dotenv').config();

const { createTransporter } = require('../src/config/email');
const { getSmtpConfig } = require('../src/config/env');

(async () => {
	const { from, fromName } = getSmtpConfig();
	const to = process.argv[2] || process.env.SMTP_USER;
	const transporter = createTransporter();

	await transporter.verify();
	console.log('SMTP verify: ok');

	const info = await transporter.sendMail({
		from: `"${fromName}" <${from}>`,
		to,
		subject: '2407 sendmail test',
		text: 'SMTP test from the 2407 sendmail service',
	});

	console.log('SENT:', info.messageId, '->', to);
})().catch((error) => {
	console.error('SMTP test failed:', error.message);
	process.exit(1);
});
