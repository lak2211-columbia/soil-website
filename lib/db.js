// Postgres connection, shared by every function. Locally this is the dev database started by
// `npm run db:start`; on Vercel it's the database connected under Storage (DATABASE_URL).

import postgres from 'postgres';
import { schema } from '../db/schema.js';

let client;

export function databaseUrl() {
  // SOIL_MAG_* is the prefix Vercel gave the Neon connection on the soil-website project.
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SOIL_MAG_DATABASE_URL || '';
}

export function db() {
  if (client) return client;
  const url = databaseUrl();
  if (!url) throw new Error('DATABASE_URL is not set. Connect a Postgres database to the Vercel project, or run `npm run db:start` locally.');
  client = postgres(url, {
    max: process.env.VERCEL ? 1 : 5,
    idle_timeout: 20,
    prepare: false, // works through connection poolers in transaction mode
    onnotice: () => {},
  });
  return client;
}

// Runs db/schema.js once per process. Every statement in it is idempotent.
let schemaReady;
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = db().unsafe(schema).catch((err) => { schemaReady = undefined; throw err; });
  }
  return schemaReady;
}

// postgres v4 encodes values for the column type itself, so jsonb parameters are passed as
// plain objects/arrays (never pre-stringified, which would store a JSON string).
export const json = (value) => value ?? null;
