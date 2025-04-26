import { hash } from 'argon2';

export default eventHandler(async (event) => {
  const body = await readBody(event);
  const db = useDatabase();
  const secret = Buffer.from(useRuntimeConfig(event).passwordSecret, 'utf-8');

  const email_required = false;

  if (!(!!body.token && !!body.name && !!body.password) || (email_required && !body.email)) {
    throw createError({
      status: 400,
      data: { error: 'Form incomplete' },
    });
  }

  const password_hash = await hash(body.password, { secret });

  const token = await db
    .selectFrom('registration_tokens')
    .selectAll()
    .where('token', 'like', String(body.token))
    .executeTakeFirst();

  if (!token || token.token != body.token) {
    throw createError({
      status: 401,
      data: { error: 'Invalid registration key' },
    });
  }

  if (Number(new Date(token.expiry).getTime()) - Number(new Date().getTime()) <= 0) {
    await db.deleteFrom('registration_tokens').where('token', '=', body.token).execute();
    throw createError({
      status: 204,
      data: { error: `Registration key expired: ${token.expiry}` },
    });
  }

  const existing_user = await db.selectFrom('users').select('name').where('name', '=', body.name).executeTakeFirst();
  if (!!existing_user) {
    throw createError({
      status: 409,
      data: { error: `User ${existing_user.name} already exists.` },
    });
  }

  const role = await db.selectFrom('role').selectAll().where('id', '=', Number(token.role)).executeTakeFirst();

  const userinsert = await db
    .insertInto('users')
    .values({
      name: body.name,
      role: token.role as number,
      password_hash: password_hash,
      email: body.email,
      bio: body.bio,
    })
    .returningAll()
    .executeTakeFirst();

  console.log(userinsert);
  if (!!userinsert) {
    await db.deleteFrom('registration_tokens').where('token', '=', body.token).execute();
    setResponseStatus(event, 201, 'Registration successful');
  } else {
    throw createError({
      status: 500,
      data: { error: 'Error accessing database' },
    });
  }
});
