import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().default(3000),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
	TUNNEL_DIR: z.string(),
	PROXY_TARGET_HOST: z.string().default('localhost'),
	PROXY_TARGET_PORT: z.coerce.number().default(80)
});

export const env = envSchema.parse(Bun.env);
