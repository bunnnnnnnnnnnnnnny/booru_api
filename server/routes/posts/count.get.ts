import { sql } from 'kysely';

export default eventHandler(async (event) => {
  const db = useDatabase();

  const count = await sql<{ count: string }>`select count(*) from posts`.execute(db);

  return Number.parseInt(count?.rows[0].count) ?? 0;
});
