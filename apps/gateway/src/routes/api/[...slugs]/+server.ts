import { Elysia } from 'elysia';
import { test } from '../test.api';

const api = new Elysia({ prefix: '/api' }).use(test);
type RequestHandler = (v: { request: Request }) => Response | Promise<Response>;

export const GET: RequestHandler = ({ request }) => api.handle(request);
export const POST: RequestHandler = ({ request }) => api.handle(request);
export const PUT: RequestHandler = ({ request }) => api.handle(request);
export const PATCH: RequestHandler = ({ request }) => api.handle(request);
export const DELETE: RequestHandler = ({ request }) => api.handle(request);
export const OPTIONS: RequestHandler = ({ request }) => api.handle(request);

export type Api = typeof api;
