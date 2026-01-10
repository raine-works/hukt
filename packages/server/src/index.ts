import { Server } from 'ssh2';
import hostKeyFile from '../.keys/host-key' with { type: 'file' };

const main = async () => {
	const hostKey = await Bun.file(hostKeyFile).text();
	const hostKeys = [hostKey];

	const PORT = 22;

	const server = new Server({ hostKeys }, (client) => {
		client.on('authentication', (ctx) => {
			if (ctx.method === 'password' && ctx.username === 'foo' && ctx.password === 'bar') {
				ctx.accept();
			} else {
				ctx.reject();
			}
		});
	});

	server.listen(PORT, '0.0.0.0');
	console.log(`SSH server listening on port ${PORT}`);
};

main();
