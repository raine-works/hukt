const { SLUG, LOCAL_TARGET, REMOTE_SERVER } = Bun.env;

const resolveTarget = (target?: string) => {
	if (!target) return 'host.docker.internal:3000'; // Default
	if (target.includes(':') && !target.startsWith('localhost')) return target;
	if (!target.includes(':')) return `host.docker.internal:${target}`;
	return target.replace('localhost', 'host.docker.internal');
};

const finalTarget = resolveTarget(LOCAL_TARGET);
const remoteSocket = `/tmp/tunnels/${SLUG}.sock`;

console.log(`🔗 Tunnel active: hukt.dev/tunnel/${SLUG} -> ${finalTarget}`);

const ssh = Bun.spawn({
	cmd: [
		'ssh',
		'-N',
		'-o',
		'ServerAliveInterval=30',
		'-o',
		'ExitOnForwardFailure=yes',
		'-R',
		`${remoteSocket}:${finalTarget}`,
		`tunnel@${REMOTE_SERVER}`
	],
	stdout: 'inherit',
	stderr: 'inherit'
});
