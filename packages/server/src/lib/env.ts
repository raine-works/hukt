import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
	HTTP_PORT: z.coerce.number(),
	SSH_PORT: z.coerce.number(),
	SOCKET_DIR: z.string().regex(/^\/([a-zA-Z0-9._-]+\/?)+$/),
	NATS_URL: z.url()
});

export const env = envSchema.parse(Bun.env);
