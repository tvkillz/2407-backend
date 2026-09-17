const { createTransporter } = require('../config/email');
const { getSmtpConfig } = require('../config/env');
const logger = require('../config/logger');

const sendEmail = async (req, res) => {
	try {
		const { recipients, cc, subject, body, attachments, replyTo } = req.body;

		if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Recipients array is required and must not be empty',
			});
		}

		if (!subject || !body) {
			return res.status(400).json({
				success: false,
				message: 'Subject and body are required',
			});
		}

		const { from, fromName } = getSmtpConfig();
		const transporter = createTransporter();

		const mailOptions = {
			from: `"${fromName}" <${from}>`,
			to: recipients.join(', '),
			subject,
			html: body,
		};

		if (typeof replyTo === 'string' && replyTo.trim()) {
			mailOptions.replyTo = replyTo.trim();
		}

		if (cc && Array.isArray(cc) && cc.length > 0) {
			mailOptions.cc = cc.join(', ');
		}

		if (attachments && Array.isArray(attachments) && attachments.length > 0) {
			mailOptions.attachments = attachments.map((attachment) => ({
				filename: attachment.filename,
				content: attachment.content,
				encoding: attachment.encoding || 'base64',
			}));
		}

		const info = await transporter.sendMail(mailOptions);

		logger.info('Email sent successfully', {
			messageId: info.messageId,
			recipients,
			subject,
		});

		res.status(200).json({
			success: true,
			message: 'Email sent successfully',
			messageId: info.messageId,
		});
	} catch (error) {
		logger.error('Error sending email', {
			error: error.message,
			stack: error.stack,
		});

		res.status(500).json({
			success: false,
			message: 'Failed to send email',
			error: error.message,
		});
	}
};

const healthCheck = async (req, res) => {
	try {
		const { host, port, user } = getSmtpConfig();
		const transporter = createTransporter();
		await transporter.verify();

		res.status(200).json({
			success: true,
			message: 'Email service is healthy',
			smtp: { host, port, user },
		});
	} catch (error) {
		logger.error('SMTP connection failed', {
			error: error.message,
		});

		res.status(500).json({
			success: false,
			message: 'Email service is not healthy',
			error: error.message,
		});
	}
};

module.exports = {
	sendEmail,
	healthCheck,
};
