import { Client } from 'pg';

const client = new Client({
  database: 'booru',
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  port: 5432,
});

async function run() {
  await client.connect();
  const tables = [
    'registration_tokens',
    'users',
    'role',
    'post_tags',
    'post_source',
    'posts',
    'tags',
    'tag_categories',
    'extensions',
    '_sqlx_migrations',
  ];
  for (const table of tables) {
    console.log(await client.query(`drop table ${table}`));
  }
  await client.end();
}
run();
