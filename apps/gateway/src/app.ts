import { Hono } from 'hono';
import { drizzle } from '@middleware/db.middleware';

export const app = new Hono();

app.use(drizzle);

app.get('/', (c) => {
	const userAgent = c.req.header('User-Agent');
	console.log(userAgent);
	return c.text('Hello World');
});
