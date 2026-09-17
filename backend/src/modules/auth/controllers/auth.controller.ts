import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
	static async register(req: Request, res: Response): Promise<void> {
		try {
			const { email, password, firstName, lastName } = req.body;
			if (!email || !password || !firstName || !lastName) {
				res.status(400).json({ error: 'email, password, firstName and lastName are required' });
				return;
			}

			const result = await AuthService.register({ email, password, firstName, lastName });
			res.status(201).json(result);
		} catch (error) {
			const message = (error as Error).message;
			res.status(message === 'User already exists' ? 400 : 400).json({ error: message });
		}
	}

	static async login(req: Request, res: Response): Promise<void> {
		try {
			const { email, password } = req.body;
			if (!email || !password) {
				res.status(400).json({ error: 'email and password are required' });
				return;
			}

			const result = await AuthService.login(email, password);
			res.json(result);
		} catch (error) {
			const message = (error as Error).message;
			const status = message === 'Account is deactivated' ? 403 : 401;
			res.status(status).json({ error: message === 'Account is deactivated' ? message : 'Invalid credentials' });
		}
	}

	static async me(req: Request, res: Response): Promise<void> {
		try {
			const result = await AuthService.getProfile(req.user!.id);
			res.json(result);
		} catch (error) {
			res.status(401).json({ error: (error as Error).message });
		}
	}
}
