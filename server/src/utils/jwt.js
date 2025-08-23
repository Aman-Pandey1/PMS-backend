import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signJwt(payload) {
	return jwt.sign(payload, env.JWT_SECRET, { expiresIn: `${env.TOKEN_TTL_DAYS}d` });
}

export function verifyJwt(token) {
	return jwt.verify(token, env.JWT_SECRET);
}