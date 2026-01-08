import { Server } from 'ssh2';

const main = async () => {
	const file = Bun.file(Bun.resolveSync('../ssh_keys/host-key', import.meta.dir));
	const hostKey = await file.text();
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
