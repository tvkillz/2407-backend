import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authConfig from '../config/auth';
import User from '../modules/users/models/User';
import logger from '../config/logger';

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				email: string;
				firstName: string;
				lastName: string;
				role: string;
			};
		}
	}
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');
		if (!token) {
			res.status(401).json({ error: 'Authentication required' });
			return;
		}

		const decoded = jwt.verify(token, authConfig.jwtSecret) as { id: string };
		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			res.status(401).json({ error: 'User not found' });
			return;
		}

		if (!user.isActive) {
			res.status(403).json({ error: 'Account is deactivated' });
			return;
		}

		req.user = {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
		};
		next();
	} catch (error) {
		logger.warn('Auth middleware error', { error: (error as Error).message });
		res.status(401).json({ error: 'Invalid token' });
	}
}
