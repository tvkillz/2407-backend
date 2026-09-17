const { getGraphConfig } = require('./env');
const logger = require('./logger');

let cachedToken = null;
let tokenExpiresAt = 0;

async function parseGraphError(response) {
	const text = await response.text();
	if (!text) {
		return `${response.status} ${response.statusText}`;
	}

	try {
		const json = JSON.parse(text);
		return json.error_description || json.error?.message || json.error || text;
	} catch {
		return text;
	}
}

async function getAccessToken() {
	if (cachedToken && Date.now() < tokenExpiresAt) {
		return cachedToken;
	}

	const { tenantId, clientId, clientSecret } = getGraphConfig();
	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		scope: 'https://graph.microsoft.com/.default',
		grant_type: 'client_credentials',
	});

	const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body,
	});

	if (!response.ok) {
		throw new Error(`Graph token request failed: ${await parseGraphError(response)}`);
	}

	const data = await response.json();
	cachedToken = data.access_token;
	tokenExpiresAt = Date.now() + Math.max(30, (data.expires_in || 3600) - 60) * 1000;
	return cachedToken;
}

function asRecipientList(addresses) {
	if (!Array.isArray(addresses)) {
		return [];
	}

	return addresses
		.filter((address) => typeof address === 'string' && address.trim())
		.map((address) => ({ emailAddress: { address: address.trim() } }));
}

async function sendMail({ recipients, cc, subject, body, attachments, replyTo }) {
	const { sender, fromName } = getGraphConfig();
	const token = await getAccessToken();

	const message = {
		subject,
		body: { contentType: 'HTML', content: body },
		toRecipients: asRecipientList(recipients),
		from: { emailAddress: { address: sender, name: fromName } },
	};

	const ccRecipients = asRecipientList(cc);
	if (ccRecipients.length) {
		message.ccRecipients = ccRecipients;
	}

	if (typeof replyTo === 'string' && replyTo.trim()) {
		message.replyTo = [{ emailAddress: { address: replyTo.trim() } }];
	}

	if (Array.isArray(attachments) && attachments.length > 0) {
		message.attachments = attachments.map((attachment) => ({
			'@odata.type': '#microsoft.graph.fileAttachment',
			name: attachment.filename,
			contentBytes: attachment.content,
			contentType: attachment.contentType || 'application/octet-stream',
		}));
	}

	const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			message,
			saveToSentItems: true,
		}),
	});

	if (response.status !== 202) {
		throw new Error(`Graph sendMail failed: ${await parseGraphError(response)}`);
	}

	logger.info('Email sent via Microsoft Graph', { sender, recipients, subject });
	return { id: response.headers.get('request-id') || undefined };
}

async function verifyGraph() {
	await getAccessToken();
	return { ok: true };
}

module.exports = {
	getAccessToken,
	sendMail,
	verifyGraph,
};
