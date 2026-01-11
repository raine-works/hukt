import { ORPCError } from '@orpc/server';
import { base, publicProcedure } from '@server/lib/orpc';
import { z } from 'zod';

export const tunnelRouter = base.router({
	GET: publicProcedure
		.route({ path: '/tunnel/:username', method: 'GET' })
		.input(z.object({ username: z.string() }))
		.handler(async ({ input, context }) => {
			const { username } = input;
			return { message: `Hello, ${username}!` };
		})
});
