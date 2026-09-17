import axios from 'axios';
import logger from '../config/logger';

const SENDMAIL_URL = process.env.SENDMAIL_URL || 'http://2407_sendmail:6001';

export class EmailService {
	static async send(input: {
		recipients: string[];
		subject: string;
		body: string;
		replyTo?: string;
		cc?: string[];
	}): Promise<void> {
		try {
			await axios.post(`${SENDMAIL_URL}/api/email/send`, input, { timeout: 20000 });
		} catch (error) {
			logger.error('Email send failed', { error });
			if (axios.isAxiosError(error)) {
				throw new Error(error.response?.data?.message || 'Email send failed');
			}
			throw error;
		}
	}
}
