const { sendMail, verifyGraph } = require('../config/email');
const { getGraphConfig } = require('../config/env');
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

		const info = await sendMail({
			recipients,
			cc,
			subject,
			body,
			attachments,
			replyTo,
		});

		res.status(200).json({
			success: true,
			message: 'Email sent successfully',
			messageId: info.id,
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
		const { sender } = getGraphConfig();
		await verifyGraph();

		res.status(200).json({
			success: true,
			message: 'Email service is healthy',
			graph: {
				sender,
			},
		});
	} catch (error) {
		logger.error('Graph connection failed', {
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
