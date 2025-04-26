import { Kysely, PostgresDialect } from 'kysely';
import { writeFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { mapPost } from '~~/lib/db';
import { DB } from '~~/lib/db/types';

const dialect = new PostgresDialect({
  pool: new Pool({
    database: 'booru',
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    port: 5432,
    max: 10,
  }),
});

export const db = new Kysely<DB>({
  dialect,
});

let outputFile = `${new Date().getTime()}.json`;

if (process.argv[2]) {
  outputFile = process.argv[2];
}

async function run() {
  const rows = await db.selectFrom('posts').selectAll().execute();
  const posts = [];
  for (const row of rows) {
    posts.push(await mapPost(db, row));
  }
  await writeFile(`dump/${outputFile}`, JSON.stringify(posts));
}
run();
