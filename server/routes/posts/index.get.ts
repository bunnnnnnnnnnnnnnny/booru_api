import { sql } from 'kysely';
import { mapPost, Post } from '~~/lib/db';

export default eventHandler(async (event) => {
  const url = getRequestURL(event);
  const search_terms = url.searchParams.get('q')?.split('+')[0].split(' ');
  console.log('searchparams q:', String(search_terms));
  console.log('searchparams page:', url.searchParams.get('page'));
  const db = useDatabase();
  const pageSize = 65;
  const offset = Number.parseInt(url.searchParams.get('offset')) || 0;
  let cursorID = 0;
  let cursorOperator = '>' as any;

  let blacklist_tag_ids = [-1];

  let first_post = 0;
  let last_post = 0;

  const before = Number.parseInt(url.searchParams.get('before'));
  console.log('searchparams before:', url.searchParams.get('before'));
  const after = Number.parseInt(url.searchParams.get('after'));
  console.log('searchparams after:', url.searchParams.get('after'));

  if (!!after) {
    cursorOperator = '>' as any;
    cursorID = after;
  }
  if (!!before) {
    cursorOperator = '<' as any;
    cursorID = before;
  }

  console.log('offset', offset, 'cursor', cursorID);

  // prioritize offset
  if (offset > 0 || !cursorID) {
    cursorID = 0;
  }

  // if (Number.parseInt(url.searchParams.get('before')) && offset == 0){
  //   cursorOperator = '<' as any;
  // }

  const tag_ids = [];

  const search_results: Post[] = [];

  console.log(search_terms);

  if (search_terms) {
    for (const term of search_terms) {
      let term_used = term;
      if (term != '') {
        if (term.startsWith('-')) {
          term_used = term.split('-')[1];
          console.log('blacklist tag found:', term_used);
        }

        try {
          console.log('checking tag', term_used);
          const tag = await db.selectFrom('tags').select('id').where('name', '=', term_used).executeTakeFirst();
          console.log('Tag', term_used, 'has id:', tag['id']);

          if (!tag) {
            console.log('!tags');

            return { posts: [], first: 0, last: 0 };
          }

          if (term != ' ') {
            if (term.startsWith('-')) {
              blacklist_tag_ids.push(tag.id);
            } else {
              tag_ids.push(tag.id);
            }
          }
        } catch {
          console.log('Tag is invalid');
          return { posts: [], first: 0, last: 0 };
        }
      }
    }
  }

  if (tag_ids.length > 0) {
    const post_ids = await db
      .selectFrom('post_tags')
      .select('post_id')
      .groupBy('post_id')
      .orderBy('post_id', !after ? 'desc' : 'asc')
      .having(
        sql<boolean>`count(case when tag_id in (${sql.join(tag_ids)}) then 1 end) = ${tag_ids.length} AND COUNT(CASE WHEN tag_id IN (${sql.join(blacklist_tag_ids)}) THEN 1 END) = 0`,
      )
      .offset(offset)
      .where('post_id', !before ? '>' : '<', cursorID)
      .limit(pageSize)
      .execute();

    // If there are no results here, then post_ids will be [] so we return no results

    if (post_ids.length > 0) {
      for (const id of post_ids) {
        console.log('reading post id ');

        const post = await db
          .selectFrom('posts')
          .selectAll()
          .where('id', '=', id.post_id ? id.post_id : 0)
          .orderBy('id', !after ? 'desc' : 'asc')
          .executeTakeFirst();

        if (!post) {
          continue;
        }

        search_results.push(await mapPost(db, post));
      }
    } else {
      return { posts: [], first: 0, last: 0 };
    }
    const first_post_db = await db
      .selectFrom('post_tags')
      .select('post_id')
      .groupBy('post_id')
      .orderBy('post_id', 'desc')
      .having(
        sql<boolean>`count(case when tag_id in (${sql.join(tag_ids)}) then 1 end) = ${tag_ids.length} AND COUNT(CASE WHEN tag_id IN (${sql.join(blacklist_tag_ids)}) THEN 1 END) = 0`,
      )
      .executeTakeFirst();

    first_post = first_post_db.post_id as number;

    const last_post_db = await db
      .selectFrom('post_tags')
      .select('post_id')
      .groupBy('post_id')
      .orderBy('post_id', 'asc')
      .having(
        sql<boolean>`count(case when tag_id in (${sql.join(tag_ids)}) then 1 end) = ${tag_ids.length} AND COUNT(CASE WHEN tag_id IN (${sql.join(blacklist_tag_ids)}) THEN 1 END) = 0`,
      )
      .executeTakeFirst();

    last_post = last_post_db.post_id as number;
  } else {
    console.log('No search terms. Displaying all posts.');

    console.log(blacklist_tag_ids);

    // const posts = await db
    //   .selectFrom('posts')
    //   .selectAll()
    //   .orderBy('id', !after ? 'desc' : 'asc')
    //   .offset(offset)
    //   .where('id', !before ? '>' : '<', cursorID)
    //   .limit(pageSize)
    //   .execute();

    // for (const post of posts) {
    //   search_results.push(await mapPost(db, post));
    // }

    console.log('blacklist');

    const post_ids = await db
      .selectFrom('post_tags')
      .select('post_id')
      .groupBy('post_id')
      .orderBy('post_id', !after ? 'desc' : 'asc')
      .having(sql<boolean>`COUNT(CASE WHEN tag_id IN (${sql.join(blacklist_tag_ids)}) THEN 1 END) = 0`)
      .offset(offset)
      .where('post_id', !before ? '>' : '<', cursorID)
      .limit(pageSize)
      .execute();
    // If there are no results here, then post_ids will be [] so we return no results

    if (post_ids.length > 0) {
      for (const id of post_ids) {
        console.log('reading post id ');

        const post = await db
          .selectFrom('posts')
          .selectAll()
          .where('id', '=', id.post_id ? id.post_id : 0)
          .orderBy('id', !after ? 'desc' : 'asc')
          .executeTakeFirst();

        if (!post) {
          continue;
        }

        search_results.push(await mapPost(db, post));
      }
    } else {
      return { posts: [], first: 0, last: 0 };
    }

    const first_post_db = await db.selectFrom('posts').selectAll().orderBy('id', 'desc').executeTakeFirst();

    first_post = first_post_db.id as number;

    const last_post_db = await db.selectFrom('posts').selectAll().orderBy('id', 'asc').executeTakeFirst();

    last_post = last_post_db.id as number;

    // get first and last of *all* as well
  }

  return { posts: !after ? search_results : search_results.reverse(), first: first_post, last: last_post };
});
