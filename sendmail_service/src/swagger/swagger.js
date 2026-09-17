const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: '2407 Email Service API',
			version: '1.0.0',
			description: 'Internal email service for 2407.services (Microsoft Graph sendMail)',
			contact: {
				name: '2407',
				email: 'kontakt@2407.services',
			},
		},
		servers: [
			{
				url: 'http://2407_sendmail:6001',
				description: 'Docker network (2407_network)',
			},
			{
				url: 'http://localhost:6001',
				description: 'Standalone local test',
			},
		],
		tags: [
			{
				name: 'Email',
				description: 'Email sending operations',
			},
		],
	},
	apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = {
	swaggerUi,
	specs,
};
