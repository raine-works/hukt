import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
	REMOTE_HOST: z.string(),
	REMOTE_PORT: z.coerce.number(),
	SSH_USERNAME: z.string(),
	SSH_PASSWORD: z.string()
});

export const env = envSchema.parse(Bun.env);
