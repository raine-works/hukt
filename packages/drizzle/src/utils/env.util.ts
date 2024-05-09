import { object, coerce, string } from 'zod';

const EnvSchema = object({
	POSTGRES_HOST: string(),
	POSTGRES_PORT: coerce.number().default(5432),
	POSTGRES_USER: string(),
	POSTGRES_PASSWORD: string(),
	POSTGRES_DATABASE: string(),
});

export const env = EnvSchema.parse(process.env);
