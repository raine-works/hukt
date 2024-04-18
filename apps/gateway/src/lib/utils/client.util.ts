import type { Api } from '../../routes/api/[...slugs]/+server';
import { treaty } from '@elysiajs/eden';
import { env } from '$env/dynamic/public';
export const client = treaty<Api>(env.PUBLIC_URL);
