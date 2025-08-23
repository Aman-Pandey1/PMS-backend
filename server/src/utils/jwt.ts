import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type JwtPayload = {
	uid: string;
	role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
	companyId?: string;
};

export function signJwt(payload: JwtPayload): string {
	return jwt.sign(payload, env.JWT_SECRET, { expiresIn: `${env.TOKEN_TTL_DAYS}d` });
}

export function verifyJwt(token: string): JwtPayload {
	return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}