import { startHTTP } from '@server/lib/http';
import { useNats } from '@server/lib/nats';
import { drainTunnels, startSSH } from '@server/lib/ssh';

await drainTunnels();
export const nats = await useNats();
const httpServer = await startHTTP();
const sshServer = await startSSH();

process.on('SIGTERM', async () => {
	console.log('Shutting down...');
	await nats.$disconnect();
	await httpServer.stop();
	sshServer.close();
	process.exit(0);
});
