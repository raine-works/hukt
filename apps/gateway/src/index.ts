import { createBunWebSocket } from 'hono/bun';
import { app } from '@src/app';
import { env } from '@utils/env.util';

const { websocket } = createBunWebSocket();

const server = Bun.serve({
	port: env.PORT,
	fetch: app.fetch,
	websocket,
});

console.log(`Server started: http://${server.hostname}:${server.port}`);
