import winston from 'winston';

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		winston.format.printf(({ timestamp, level, message, ...meta }) => {
			const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
			return `${timestamp} ${level}: ${message}${extra}`;
		})
	),
	transports: [new winston.transports.Console()],
});

export default logger;
