import type { Context, Next } from 'hono';
import { db } from '@hukt/drizzle';

export const drizzle = async (c: Context, next: Next) => {
	c.db = db;
	await next();
};
