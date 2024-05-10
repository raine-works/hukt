import { object, coerce } from 'zod';

const EnvSchema = object({
	PORT: coerce.number().default(5432),
});

export const env = EnvSchema.parse(process.env);
