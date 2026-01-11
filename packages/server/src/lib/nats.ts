import { env } from '@server/lib/env';
import { connect, JSONCodec, type KV, StringCodec } from 'nats';

export const useNats = async () => {
	const client = await connect({
		servers: env.NATS_URL,
		reconnect: true,
		maxReconnectAttempts: 10
	});

	console.log(`Connected to ${client.getServer()}.`);

	const jetstream = client.jetstream();
	const stringCodec = StringCodec();
	const jsonCodec = JSONCodec();
	const kvBucket = await jetstream.views.kv('active_tunnels');
	const activeTunnels = new TypedKV<{ targetHost: string; targetPort: number; socketPath: string }>(kvBucket);

	const $disconnect = async () => {
		await Bun.sleep(1000);
		await client.drain();
		await client.close();
	};

	return {
		client,
		jetstream,
		stringCodec,
		jsonCodec,
		activeTunnels,
		$disconnect
	};
};

class TypedKV<T> {
	#codec = JSONCodec<T>();
	#kv: KV;

	constructor(kv: KV) {
		this.#kv = kv;
	}

	async set(key: string, value: T): Promise<number> {
		return await this.#kv.put(key, this.#codec.encode(value));
	}

	async get(key: string): Promise<T | null> {
		const entry = await this.#kv.get(key);
		return entry ? this.#codec.decode(entry.value) : null;
	}

	async delete(key: string): Promise<void> {
		await this.#kv.purge(key);
	}
}
