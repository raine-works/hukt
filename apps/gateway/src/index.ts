import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import { drizzle } from '@middleware/db.middleware';
import { env } from '@utils/env.util';

const app = new Hono();
const { websocket, upgradeWebSocket } = createBunWebSocket();

app.use(drizzle);

app.get('/', (c) => {
	const userAgent = c.req.header('User-Agent');
	console.log(userAgent);
	return c.text('Hello World');
});

app.get(
	'/ws',
	upgradeWebSocket((c) => {
		return {};
	}),
);

const server = Bun.serve({
	port: env.PORT,
	fetch: app.fetch,
	websocket,
});

console.log(`Server started: http://${server.hostname}:${server.port}`);
