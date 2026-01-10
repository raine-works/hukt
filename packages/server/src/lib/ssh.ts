import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { tryCatch } from '@hukt/tools/tryCatch';
import { env } from '@server/lib/env';
import { Server } from 'ssh2';

export const activeTunnels = new Map<string, { targetHost: string; targetPort: number; socketPath: string }>();

const drainTunnels = () => {
	if (!existsSync(env.TUNNEL_DIR)) {
		mkdirSync(env.TUNNEL_DIR, { recursive: true });
		return;
	}

	const files = readdirSync(env.TUNNEL_DIR);
	for (const file of files) {
		if (file.endsWith('.sock')) {
			const { error } = tryCatch(() => unlinkSync(join(env.TUNNEL_DIR, file)));

			if (error) {
				console.error(`Failed to drain ${file}:`, error);
			} else {
				console.log(`Drained orphaned socket: ${file}`);
			}
		}
	}
};

export const startSSHServer = async (port: number) => {
	drainTunnels();

	const hostKeyPath = `${Bun.env.HOME}/.ssh/host_key`;
	const hostKey = await Bun.file(hostKeyPath).text();

	const sshServer = new Server({ hostKeys: [hostKey] }, (client) => {
		let username: string | null = null;

		client.on('authentication', (ctx) => {
			if (ctx.method === 'password' && ctx.username === 'foo' && ctx.password === 'bar') {
				username = ctx.username;
				return ctx.accept();
			}
			return ctx.reject();
		});

		client.on('request', (accept, reject, name) => {
			if ((name as string) === 'streamlocal-forward@openssh.com' || name === 'tcpip-forward') {
				if (!username) return reject?.();

				const targetHost = 'nginx';
				const targetPort = 8000;

				const socketPath = join(env.TUNNEL_DIR, `${username}.sock`);

				if (existsSync(socketPath)) unlinkSync(socketPath);

				const unixServer = createServer((browserSocket) => {
					console.log('🔌 Bun Gateway connected to Unix Socket');

					client.forwardOut('localhost', 0, targetHost, targetPort, (err, sshStream) => {
						if (err) {
							console.error('SSH Forwarding Error:', err);
							return browserSocket.end();
						}

						console.log('SSH Tunnel Stream opened to Client');

						browserSocket.on('data', (chunk) => {
							console.log(`Sending ${chunk.length} bytes to SSH Stream`);
							if (!sshStream.write(chunk)) {
								console.log('SSH Stream buffer full, waiting for drain...');
							}
						});
					});
				});

				unixServer.listen(socketPath, () => {
					console.log(`Bridge active`);
					activeTunnels.set(username!, {
						targetHost,
						targetPort,
						socketPath
					});
					if (typeof accept === 'function') accept();
				});

				client.on('close', () => {
					unixServer.close();
					activeTunnels.delete(username!);
					if (existsSync(socketPath)) {
						const { error } = tryCatch(() => unlinkSync(socketPath));

						if (error) {
							console.error(`Failed to remove socket ${socketPath}:`, error);
						}
					}
					console.log(`🗑️ Tunnel ${username} cleaned up.`);
				});
			}
		});
	});

	sshServer.listen(port, () => console.log(`🚀 SSH Server listening on port ${port}`));
};
