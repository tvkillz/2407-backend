require('dotenv').config();

const { sendMail, verifyGraph } = require('../src/config/email');
const { getGraphConfig } = require('../src/config/env');

(async () => {
	const { sender } = getGraphConfig();
	const to = process.argv[2] || sender;

	await verifyGraph();
	console.log('Graph verify: ok', sender);

	const info = await sendMail({
		recipients: [to],
		subject: '2407 sendmail Graph test',
		body: '<p>Graph sendMail test from the 2407 sendmail service</p>',
	});

	console.log('SENT:', info.id || '202', '->', to);
})().catch((error) => {
	console.error('Graph test failed:', error.message);
	process.exit(1);
});
