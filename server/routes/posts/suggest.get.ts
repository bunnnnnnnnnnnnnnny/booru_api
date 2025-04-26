import { sql } from 'kysely';

export type tagswithcount = {
  name: string;
  count: number;
};

function sortByKey(array, key) {
  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? 1 : x > y ? -1 : 0;
  });
}

export default eventHandler(async (event) => {
  const url = getRequestURL(event);
  const suggestTerms = url.searchParams.get('suggest').split(' ');
  const lastTerm = suggestTerms[suggestTerms.length - 1];

  console.log('searchparams suggest:', lastTerm);

  const db = useDatabase();

  // .orderBy("COUNT(*) DESC").
  const tags = await db
    .selectFrom('tags')
    .select('name')
    .select('id')
    .where('name', 'like', `${lastTerm}%`)
    .limit(20)
    .execute();

  if (!tags) {
    event.respondWith(new Response(null, { status: 404 }));
    return;
  } else {
    console.log('returning', tags);
    console.log(tags[0].name);
  }

  const returnTags = [];

  for (const tag in tags) {
    const count = await sql<{ count: string }>`select count(*) from post_tags where tag_id = ${tags[tag].id}`.execute(
      db,
    );
    console.log('Count of', tags[tag].name, 'is', count.rows[0].count);
    returnTags.push({ name: tags[tag].name, count: Number(count['rows'][0].count) });
  }

  return sortByKey(returnTags, 'count');
});
