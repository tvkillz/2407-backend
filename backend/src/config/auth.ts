const authConfig = {
	jwtSecret: process.env.JWT_SECRET || 'change-me-jwt-secret',
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
	saltRounds: 10,
};

export default authConfig;
