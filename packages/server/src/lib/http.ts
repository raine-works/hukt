import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError } from '@orpc/server';
import { env } from '@server/lib/env.js';
import { base } from '@server/lib/orpc';
import { tunnelRouter } from '@server/routers/tunnel';
import { forwardTunnelRequests } from './ssh';

const router = base.router({
	tunnel: tunnelRouter
});

const handler = new OpenAPIHandler(router, {
	plugins: [],
	interceptors: [
		onError((error) => {
			console.error((error as Error).message);
		})
	]
});

export const startHTTP = async () => {
	console.log(`HTTP server listening on port ${env.HTTP_PORT}.`);

	return Bun.serve({
		development: env.NODE_ENV === 'development',
		port: env.HTTP_PORT,
		async fetch(request) {
			const orpc = await handler.handle(request, {
				prefix: '/api',
				context: { headers: request.headers }
			});

			if (orpc.matched) {
				return orpc.response;
			}

			const tunnel = await forwardTunnelRequests(request);

			if (tunnel.matched) {
				return tunnel.response;
			}

			return new Response('Not found', { status: 404 });
		}
	});
};
