export default defineEventHandler(async (event) => {
  const db = useDatabase();

  console.log('meow');

  const body = await readBody(event);
  const addTags = [];
  const removeTags = [];
  const tagsRaw = body.tags.toString().split(',');
  const tags = [];
  const addTagIDs = [];
  const removeTagIDs = [];
  const createTags = [];

  for (const tag in tagsRaw) {
    console.log('penis');
    // console.log('for tag:', tags[tag]);
    if (tagsRaw[tag] != ' ' && tagsRaw[tag] != '') {
      // tags.splice(tags[tag]);
      tags.push(tagsRaw[tag]);
    }
  }

  console.log('\n\n\n\n\n\n\n\n\nInput:');
  console.log(body);
  console.log('\n');
  console.log('tags =', tags);
  console.log('It should be:', body.tags.toString().split(','));

  for (const tag in tags) {
    const thisTag = tags[tag];

    console.log('Looking at tag:', thisTag);

    if (thisTag.startsWith('-')) {
      removeTags.push(thisTag.split('-')[1].toString());
      console.log('To be removed:', thisTag.split('-')[1]);

      const removethese = await db
        .selectFrom('tags')
        .select('id')
        .where('name', '=', thisTag.split('-')[1])
        .executeTakeFirst();
      if (!!removethese) {
        removeTagIDs.push(removethese['id'] as number);
      } else {
        console.log('Tag', thisTag.split('-')[1], "doesn't exist yet.");
      }
      console.log('removeTagIDs contents:', removeTagIDs);
    } else {
      addTags.push(thisTag);
      console.log(`To be added: ${thisTag}`);
      const addthese = await db.selectFrom('tags').select('id').where('name', '=', thisTag).executeTakeFirst();
      if (!!addthese) {
        addTagIDs.push(addthese['id'] as number);
      } else {
        console.log('Tag', thisTag, "doesn't exist yet.");
        if (!createTags.includes(thisTag)) {
          createTags.push(thisTag);
        } else {
          console.log("But it's already going to be made");
        }
      }
      console.log('addTagIDs contents:', addTagIDs);
    }
  }

  console.log('createTags:', createTags);
  if (createTags.length > 0) {
    for (const tag in createTags) {
      // add the tags to the db and get the id, then add it to the post
      console.log('Attempting to create tag', createTags[tag]);
      const id = await db.insertInto('tags').values({ name: createTags[tag] }).returning('id').execute();
      addTagIDs.push(id[0]);
      console.log('Created tag', createTags[tag], 'with ID', id);
    }
  }

  console.log('\n');
  for (const post in body.posts) {
    const thispost = body.posts[post];
    const postContent = await db
      .selectFrom('posts')
      .selectAll()
      .where('id', '=', thispost as number)
      .execute();
    // console.log("Post #", thispost, "currently has the tags", postContent.values);
    // console.log(postContent.values);

    let partTwo = '';
    if (removeTags.length > 0) {
      partTwo = `\nand lose the tags:\n    ${removeTags}`;
    }
    console.log('Post #', thispost, 'should receive the tags:\n   ', addTags, partTwo, '\n');

    console.log('addTags:', addTags);

    console.log('addTagIDs:', JSON.stringify(addTagIDs));
    console.log(addTagIDs);
    if (addTagIDs.length > 0) {
      // add the tags to the db
      for (const { id } of addTagIDs) {
        console.log('value:', id);
        if (!!id) {
          console.log('Inserting tag ID:', id);
          await db
            .insertInto('post_tags')
            .values({ post_id: thispost, tag_id: id as number })
            .execute();
        }
      }
    }

    if (removeTagIDs.length > 0) {
      await db
        .deleteFrom('post_tags')
        .where('post_id', '=', thispost as number)
        .where('tag_id', 'in', removeTagIDs)
        .execute();
    }
  }
});
