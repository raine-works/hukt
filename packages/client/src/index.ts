import { connect } from 'node:net';
import { env } from '@client/lib/env';
import { asyncRetry } from '@tanstack/pacer';
import { Client } from 'ssh2';

const openTunnel = () => {
	return new Promise((_resolve, reject) => {
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

		client.on('tcp connection', (info, accept, reject) => {
			const local = connect(info.destPort, info.destIP, () => {
				const stream = accept();
				stream.pipe(local).pipe(stream);
			});

			local.on('error', (err) => {
				console.error('Local connection error:', err);
				reject();
			});
		});

		client.on('error', (err) => {
			console.error('SSH Error:', err);
			reject();
		});

		client.on('close', () => {
			console.log('Connection closed.');
			reject();
		});

		client.connect({
			host: env.REMOTE_HOST,
			port: env.REMOTE_PORT,
			username: env.SSH_USERNAME,
			password: env.SSH_PASSWORD,
			keepaliveInterval: 10000
		});
	});
};

const main = asyncRetry(openTunnel, {
	backoff: 'fixed',
	baseWait: 3000,
	maxAttempts: Infinity
});

await main();
