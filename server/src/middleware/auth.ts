import type { Request, Response, NextFunction } from 'express';
import { verifyJwt, type JwtPayload } from '../utils/jwt.js';

export type AuthUser = JwtPayload & { token: string };

declare global {
	namespace Express {
		interface Request {
			user?: AuthUser;
		}
	}
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization || '';
	const [, token] = header.split(' ');
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const payload = verifyJwt(token);
		req.user = { ...payload, token };
		return next();
	} catch {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

export function requireRoles(...roles: JwtPayload['role'][]) {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
		if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
		next();
	};
}

export function requireCompanyScope(req: Request, res: Response, next: NextFunction) {
	if (req.user?.role === 'SUPER_ADMIN') return next();
	const routeCompanyId = (req.params.companyId || req.body.companyId || req.query.companyId) as string | undefined;
	if (!routeCompanyId) return res.status(400).json({ error: 'companyId required' });
	if (req.user?.companyId !== routeCompanyId) return res.status(403).json({ error: 'Forbidden company scope' });
	next();
}