import { env } from '@client/lib/env';
import { tryCatch } from '@hukt/tools/tryCatch';
import { asyncRetry } from '@tanstack/pacer';
import { Client } from 'ssh2';

const openTunnel = () => {
	return new Promise<void>((_r, reject) => {
		const client = new Client();

		client.on('ready', () => {
			console.log('Client Ready');
			const remoteSocket = `/tmp/tunnels/${env.SSH_USERNAME}.sock`;

			client.openssh_forwardInStreamLocal(remoteSocket, (err) => {
				if (err) {
					console.error('Failed to setup StreamLocal forward:', err.message);
					return;
				}

				console.log(`Remote tunnel established at ${remoteSocket}`);
			});
		});

		client.on('error', (err) => {
			console.error('SSH Error:', err.message);
			reject();
		});

		client.on('close', () => {
			console.log('Connection closed.');
			reject();
		});

		client.connect({
			host: env.SSH_HOST,
			port: env.SSH_PORT,
			username: env.SSH_USERNAME,
			password: env.SSH_PASSWORD,
			keepaliveInterval: 10000,
			strictVendor: true
		});
	});
};

const main = asyncRetry(openTunnel, {
	maxAttempts: 10,
	backoff: 'exponential',
	baseWait: 1000
});

const { error } = await tryCatch(main());

if (error) {
	console.log('Cannot connect to host. Giving up...');
	process.exit(0);
}

process.on('SIGTERM', async () => {
	console.log('Shutting down...');
	process.exit(0);
});
