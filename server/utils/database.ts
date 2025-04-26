import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { DB } from '~~/lib/db/types';

let db: Kysely<DB> | null = null;

function createDb() {
  const config = useRuntimeConfig();
  const dialect = new PostgresDialect({
    pool: new pg.Pool({
      database: config.pg.database,
      host: config.pg.host,
      user: config.pg.user,
      password: config.pg.password,
      port: Number(config.pg.port),
      max: 10,
    }),
  });

  db = new Kysely<DB>({
    dialect,
  });
}

export function useDatabase() {
  if (!db) {
    createDb();
  }

  return db!;
}
