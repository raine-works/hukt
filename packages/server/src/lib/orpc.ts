import { os } from '@orpc/server';

export type Context = {
	headers: Headers;
};

const base = os.$context<Context>();
const publicProcedure = base;

export { base, publicProcedure };
