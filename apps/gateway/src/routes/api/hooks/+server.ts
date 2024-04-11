import { json } from '@sveltejs/kit';

export const GET = () => {
	return json({ message: 'OK' }, { status: 200 });
};
