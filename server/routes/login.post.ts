import { verify } from 'argon2';

export default eventHandler(async (event) => {
  const body = await readBody(event);
  const db = useDatabase();
  const secret = Buffer.from(useRuntimeConfig(event).passwordSecret, 'utf-8');

  const returnstrings = [];

  const user = await db
    .selectFrom('users')
    .select('password_hash')
    .where('name', '=', body.username)
    .executeTakeFirst();

  if (user == null) {
    return 'wtf';
  }

  returnstrings.push(`hii ${body.username}`);

  if (await verify(user.password_hash, body.password, { secret })) {
    returnstrings.push('your password works');
  } else {
    // password did not match
  }

  return returnstrings.join('<br>');
});
