function getEnv(name: string, fallback?: string): string {
	const v = process.env[name];
	if (v && v.length > 0) return v;
	if (fallback !== undefined) return fallback;
	throw new Error(`Missing env: ${name}`);
}

export const env = {
	PORT: Number(getEnv('PORT', '4000')),
	MONGO_URI: getEnv('MONGO_URI', 'mongodb://localhost:27017/ems'),
	JWT_SECRET: getEnv('JWT_SECRET', 'change-me'),
	TOKEN_TTL_DAYS: Number(getEnv('TOKEN_TTL_DAYS', '7')),
	CORS_ORIGIN: getEnv('CORS_ORIGIN', '*'),
};