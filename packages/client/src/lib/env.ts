import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
	REMOTE_URL: z.url(),
	SSH_USERNAME: z.string(),
	SSH_PASSWORD: z.string()
});

export const env = envSchema.parse(Bun.env);
