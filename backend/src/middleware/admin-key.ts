import { Request, Response, NextFunction } from 'express';

export function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
	const expected = process.env.ADMIN_API_KEY;
	if (!expected) {
		res.status(500).json({ error: 'ADMIN_API_KEY is not configured' });
		return;
	}

	const provided = req.header('x-api-key');
	if (!provided || provided !== expected) {
		res.status(401).json({ error: 'Unauthorized' });
		return;
	}

	next();
}
