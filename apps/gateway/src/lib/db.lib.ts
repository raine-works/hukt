import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

const client = new Client({
	connectionString: 'postgres://user:password@host:port/db',
});

await client.connect();
const db = drizzle(client);
