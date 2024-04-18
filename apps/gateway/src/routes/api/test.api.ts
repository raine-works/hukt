import { Elysia, t } from 'elysia';

export const test = new Elysia({ prefix: '/test' })
	.get('/', ({ body }) => {
		return (body = { msg: 'Hello World' });
	})
	.ws('/ws', {
		body: t.Object({
			message: t.String(),
		}),
		message(ws, { message }) {
			ws.send({
				message,
				time: Date.now(),
			});
		},
	});
