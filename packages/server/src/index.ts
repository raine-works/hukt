import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { tryCatch } from '@hukt/tools/tryCatch';
import { activeTunnels } from '@server/lib/ssh';
import { Server } from 'ssh2';

const PORT = 2222;
const HTTP_PORT = 3000;
const TUNNEL_DIR = '/tmp/tunnels';

if (!existsSync(TUNNEL_DIR)) mkdirSync(TUNNEL_DIR, { recursive: true });

const startSSH = async () => {
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
				if (!username) return reject?.();

				const socketPath = join(TUNNEL_DIR, `${username}.sock`);

				const targetHost = 'nginx';
				const targetPort = 80;

				if (existsSync(socketPath)) unlinkSync(socketPath);

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

				unixServer.listen(socketPath, () => {
					console.log(`Bridge active: ${socketPath} -> ${targetHost}`);
					activeTunnels.set(username, { targetHost, targetPort, socketPath });
					if (accept) accept();
				});

				client.on('close', () => {
					unixServer.close();
					activeTunnels.delete(username);
					if (existsSync(socketPath)) tryCatch(() => unlinkSync(socketPath));
					console.log(`Tunnel ${username} cleaned up.`);
				});
			}
		});
	});

	sshServer.listen(PORT, '0.0.0.0', () => console.log(`SSH listening on :${PORT}`));
};

const startHTTP = () => {
	return Bun.serve({
		port: HTTP_PORT,
		async fetch(req) {
			const url = new URL(req.url);
			const parts = url.pathname.split('/');
			const username = parts[2];

			if (!username) return new Response('Missing username', { status: 400 });

			const tunnel = activeTunnels.get(username);
			if (!tunnel) return new Response('Tunnel not active', { status: 404 });

			const forwardPath = url.pathname.split(username)[1] || '/';
			const targetUrl = `http://${tunnel.targetHost}:${tunnel.targetPort}${forwardPath}${url.search}`;

			console.log(`[${username}] Proxying to: ${targetUrl}`);

			const headers = new Headers(req.headers);
			headers.set('host', tunnel.targetHost);

			const { error, data } = await tryCatch(
				fetch(targetUrl, {
					method: req.method,
					headers: headers,
					redirect: 'manual',
					tls: {
						rejectUnauthorized: false
					}
				})
			);
			if (error) {
				console.error('Fetch Error:', error);
				return new Response(`Proxy Error: ${error.message}`, { status: 502 });
			}

			return data;
		}
	});
};

startSSH();
startHTTP();
console.log(`HTTP Gateway on :${HTTP_PORT}`);
