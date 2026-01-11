import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
	SSH_HOST: z.string(),
	SSH_PORT: z.coerce.number().default(22),
	SSH_USERNAME: z.string(),
	SSH_PASSWORD: z.string()
});

export const env = envSchema.parse(Bun.env);
