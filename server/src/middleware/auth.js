import { verifyJwt } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
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

export function requireRoles(...roles) {
	return (req, res, next) => {
		if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
		if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
		next();
	};
}

export function requireCompanyScope(req, res, next) {
	if (req.user?.role === 'SUPER_ADMIN') return next();
	const routeCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;
	if (!routeCompanyId) return res.status(400).json({ error: 'companyId required' });
	if (req.user?.companyId !== routeCompanyId) return res.status(403).json({ error: 'Forbidden company scope' });
	next();
}