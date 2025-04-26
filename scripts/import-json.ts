import { Kysely, PostgresDialect } from 'kysely';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { Pool } from 'pg';
import { DB, Extensions, Tags } from '../lib/db/types';

type Post = {
  id: number;
  md5: string;
  title: string;
  filename: string;
  ext: string;
  description: string;
  tags: string[];
  categories: string[];
  trans: boolean;
  animated: boolean;
  created_at: Date;
  updated_at: Date;
  source: string[];
};

const default_post = {
  tags: [],
  categories: [],
  trans: false,
  timestamp: 0,
  animated: false,
  source: [],
};

const inputFile = process.argv[2];

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

async function run() {
  const data = await readFile(inputFile, 'utf-8');
  const posts = JSON.parse(data).map((x) => ({ ...default_post, ...x })) as Post[];
  const newTags: Map<string, Partial<Tags>> = new Map();
  const newExtensions: Map<string, Partial<Extensions>> = new Map();
  // const newPostSource: Map<string, Partial<PostSource>> = new Map();

  for (const post of posts) {
    for (const tag of post.tags) {
      if (!newTags.has(tag)) {
        newTags.set(tag, { name: tag });
      }
    }

    if (!newExtensions.has(post.ext)) {
      newExtensions.set(post.ext, { name: post.ext });
    }
    // for (const source of post.source){
    //   if (!newPostSource.has(source)) {
    //     newPostSource.set(source, { post_source: source });
    //   }
    // }
  }

  const returnedTags = await db
    .insertInto('tags')
    .values([...newTags.values()])
    .returning('id')
    .returning('name')
    .execute();
  const tags = new Map(returnedTags.map((x) => [x.name, x]));

  const returnedExtensions = await db
    .insertInto('extensions')
    .values([...newExtensions.values()])
    .returning('id')
    .returning('name')
    .execute();
  const extensions = new Map(returnedExtensions.map((x) => [x.name, x]));

  for (const post of posts) {
    const postFilePath = `./server/public/files/${post.md5}.${post.ext}`;
    if (existsSync(postFilePath)) {
      console.info('i finded the file :3');
      const stats = await stat(postFilePath);
      // const postFile = new File([], postFilePath);
      // post.created_at = new Date(postFile.lastModified);
      post.created_at = stats.ctime;
      post.updated_at = stats.mtime;
    } else {
      post.created_at = new Date();
      post.updated_at = new Date();
      console.info('i cant find it... ;-;');
    }

    console.log('inserting', post.md5);
    if (post.created_at) {
      console.log('timestamp is', post.created_at);
    }
    try {
      const tagIds = post.tags.map((tag) => tags.get(tag)?.id).filter((x) => !!x);

      const extensionId = extensions.get(post.ext)?.id;

      if (!extensionId) {
        console.error(`Extension "${post.ext}" not found`);
        continue;
      }

      const { id: post_id } = (await db
        .insertInto('posts')
        .values({
          md5: post.md5,
          filename: post.filename,
          ext_id: extensionId,
          description: post.description,
          trans: post.trans,
          animated: post.animated,
          created_at: post.created_at,
          updated_at: post.updated_at,
        })
        .returning('id')
        .onConflict((c) => c.column('md5').doNothing())
        .executeTakeFirst()) ?? { id: null };

      if (!post_id) {
        console.error(`Failed to insert post with md5: ${post.md5}`);
        continue;
      }

      console.log('inserted poggy', post_id);

      await db
        .insertInto('post_tags')
        .values(tagIds.map((tag_id) => ({ post_id, tag_id })))
        .execute();

      console.log('Trying to insert post.source which contains', post.source);

      for (const source in post.source) {
        console.log('trying to insert into post_source values post_id:', post_id, 'post_source:', post.source[source]);
        await db
          .insertInto('post_source')
          .values({
            post_id: post_id,
            post_source: post.source[source],
          })
          .execute();
      }
    } catch (e) {
      console.error(e);
    }
  }

  console.log('pogu mewtwo');
  process.exit(0);
}

run();
