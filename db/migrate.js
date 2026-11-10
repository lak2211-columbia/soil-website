// Applies db/schema.js. The site also does this on its own the first time it connects,
// so this is only needed to check the schema by hand.

import { db, ensureSchema } from '../lib/db.js';
import { loadEnv } from '../dev/db.js';

if (!process.env.VERCEL) loadEnv();
await ensureSchema();
const tables = await db()`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
console.log('Schema ready:', tables.map((t) => t.table_name).join(', '));
await db().end();
