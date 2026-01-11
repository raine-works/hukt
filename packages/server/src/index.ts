import { startHTTP } from '@server/lib/http';
import { drainTunnels, startSSH } from '@server/lib/ssh';

await drainTunnels();
await startSSH();
await startHTTP();
