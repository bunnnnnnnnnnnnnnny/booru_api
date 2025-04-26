import { Kysely } from 'kysely';
import { DB } from './types';

export type DbPost = {
  animated: boolean;
  description: string | null;
  ext_id: number;
  filename: string;
  id: number;
  md5: string;
  created_at: Date;
  updated_at: Date;
  trans: boolean;
  //  source: string[];
};

export type Post = {
  id: number;
  md5: string;
  title: string;
  filename: string;
  ext: string;
  description: string | null;
  tags: string[];
  trans: boolean;
  created_at: Date;
  updated_at: Date;
  animated: boolean;
  source: string[];
};

export async function mapPost(db: Kysely<DB>, post: DbPost): Promise<Post> {
  const extension = await db.selectFrom('extensions').select('name').where('id', '=', post.ext_id).executeTakeFirst();

  const tags = [];
  const postTags = await db.selectFrom('post_tags').select('tag_id').where('post_id', '=', post.id).execute();

  for (const postTag of postTags) {
    const tag = await db.selectFrom('tags').select('name').where('id', '=', postTag.tag_id).executeTakeFirst();
    tags.push(tag.name);
  }

  const source = [];
  const postSource = await db.selectFrom('post_source').select('post_source').where('post_id', '=', post.id).execute();

  console.log(postSource);

  for (const { post_source } of postSource) {
    source.push(post_source);
  }

  // console.debug({ post, extension, postTags, tags });

  return {
    id: post.id,
    md5: post.md5,
    title: post.filename,
    filename: post.filename,
    ext: extension.name,
    description: post.description,
    tags,
    trans: post.trans,
    created_at: post.created_at,
    updated_at: post.updated_at,
    animated: post.animated,
    source,
  };
}
