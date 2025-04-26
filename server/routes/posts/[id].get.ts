import { mapPost } from '~~/lib/db';

export default eventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id');
  const id = idParam && Number.parseInt(idParam);

  if (!id) {
    event.respondWith(new Response(null, { status: 400 }));
    return;
  }

  const db = useDatabase();

  const post = await db.selectFrom('posts').selectAll().where('id', '=', id).executeTakeFirst();

  if (!post) {
    event.respondWith(new Response(null, { status: 404 }));
    return;
  }

  return await mapPost(db, post);
});
