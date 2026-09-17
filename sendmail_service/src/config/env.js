function getGraphConfig() {
	const tenantId = process.env.GRAPH_TENANT_ID;
	const clientId = process.env.GRAPH_CLIENT_ID;
	const clientSecret = process.env.GRAPH_CLIENT_SECRET;
	const sender = process.env.GRAPH_SENDER || process.env.SMTP_FROM || 'kontakt@2407.services';
	const fromName = process.env.GRAPH_FROM_NAME || process.env.SMTP_FROM_NAME || '2407';

	if (!tenantId || !clientId || !clientSecret) {
		throw new Error('GRAPH_TENANT_ID, GRAPH_CLIENT_ID and GRAPH_CLIENT_SECRET are required');
	}

	return { tenantId, clientId, clientSecret, sender, fromName };
}

function assertEnv() {
	getGraphConfig();
}

module.exports = {
	getGraphConfig,
	assertEnv,
};
