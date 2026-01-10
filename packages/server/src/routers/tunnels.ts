import { ORPCError } from '@orpc/server';
import { base, publicProcedure } from '@server/lib/orpc';
import { z } from 'zod';

export const tunnelsRouter = base.router({});
