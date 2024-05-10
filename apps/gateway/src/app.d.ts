import { db } from '@hukt/drizzle';

declare module 'hono' {
	interface Context {
		db: typeof db;
	}
}
