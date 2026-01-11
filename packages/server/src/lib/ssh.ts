import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { tryCatch } from '@hukt/tools/tryCatch';
import { nats } from '@server/index';
import { env } from '@server/lib/env';
import { Server } from 'ssh2';

export const drainTunnels = async () => {
	if (!existsSync(env.SOCKET_DIR)) {
		return mkdirSync(env.SOCKET_DIR, { recursive: true });
	}

	const files = readdirSync(env.SOCKET_DIR);

	for (const file of files) {
		if (file.endsWith('.sock')) {
			const { error } = tryCatch(() => unlinkSync(join(env.SOCKET_DIR, file)));

			if (error) {
				console.error(`Failed to drain ${file}:`, error);
			} else {
				console.log(`Drained orphaned socket: ${file}`);
			}
		}
	}
};

export const startSSH = async () => {
	const hostKeyPath = `${Bun.env.HOME}/.ssh/host_key`;
	const hostKey = await Bun.file(hostKeyPath).text();

	const sshServer = new Server({ hostKeys: [hostKey] }, (client) => {
		let username: string;

		client.on('authentication', (ctx) => {
			if (ctx.method === 'password' && ctx.username === 'foo' && ctx.password === 'bar') {
				username = ctx.username;
				return ctx.accept();
			}
			ctx.reject();
		});

		client.on('request', (accept, reject, name) => {
			if ((name as string) === 'streamlocal-forward@openssh.com' || name === 'tcpip-forward') {
				if (!username) {
					return reject?.();
				}

				const socketPath = join(env.SOCKET_DIR, `${username}.sock`);
				const targetHost = 'google.com';
				const targetPort = 80;

				if (existsSync(socketPath)) {
					unlinkSync(socketPath);
				}

				const unixServer = createServer((browserSocket) => {
					client.forwardOut('0.0.0.0', 0, targetHost, targetPort, (err, sshStream) => {
						if (err) {
							console.error('SSH Forwarding Error:', err);
							return browserSocket.end();
						}
						console.log('SSH Tunnel Stream opened');
						browserSocket.pipe(sshStream).pipe(browserSocket);
					});
				});

				unixServer.listen(socketPath, async () => {
					console.log(`Bridge active: ${socketPath} -> ${targetHost}`);
					await nats.activeTunnels.set(username, { targetHost, targetPort, socketPath });
					if (accept) {
						accept();
					}
				});

				client.on('close', async () => {
					unixServer.close();
					await nats.activeTunnels.delete(username);

					if (existsSync(socketPath)) {
						tryCatch(() => unlinkSync(socketPath));
						console.log(`Tunnel ${username} cleaned up.`);
					}
				});
			}
		});
	});

	sshServer.listen(env.SSH_PORT, '0.0.0.0', () => console.log(`SSH server listening on port ${env.SSH_PORT}.`));

	return sshServer;
};

type ForwardTunnelResponse = { matched: true; response: Response } | { matched: false; response?: never };

export const forwardTunnelRequests = async (request: Request): Promise<ForwardTunnelResponse> => {
	const url = new URL(request.url);
	const parts = url.pathname.split('/').filter(Boolean);
	const route = parts[0];
	const username = parts[1];

	if (route !== 'tunnel') {
		return { matched: false };
	}

	if (!username) {
		return { response: new Response('Missing username', { status: 400 }), matched: true };
	}

	const tunnel = await nats.activeTunnels.get(username);

	if (!tunnel) {
		return { response: new Response('Tunnel not active', { status: 404 }), matched: true };
	}

	const forwardPath = url.pathname.split(username)[1] || '/';
	const targetUrl = `http://${tunnel.targetHost}:${tunnel.targetPort}${forwardPath}${url.search}`;

	console.log(`[${username}] Proxying to: ${targetUrl}`);

	const headers = new Headers(request.headers);
	// headers.set('host', tunnel.targetHost);

	const { error, data } = await tryCatch(
		fetch(targetUrl, {
			method: request.method,
			headers: headers,
			redirect: 'manual',
			tls: {
				rejectUnauthorized: false
			}
		})
	);

	if (error) {
		console.error('Fetch Error:', error);
		return { response: new Response(`Proxy Error: ${error.message}`, { status: 502 }), matched: true };
	}

	return { response: data, matched: true };
};
