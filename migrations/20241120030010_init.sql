create table extensions (
  id   int generated always as identity primary key,
  name text not null
);

create table tag_categories (
  id   int generated always as identity primary key,
  name text not null
);

create table tags (
  id       int generated always as identity primary key,
  name     text not null,
  category int references tag_categories (id)
);

create table posts (
  id           int generated always as identity primary key,
  md5          varchar(32) not null unique,
  filename     text,
  ext_id       int         not null references extensions (id),
  description  text,
  trans        boolean     not null default false,
  animated     boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table post_tags (
  post_id int not null references posts (id),
  tag_id  int not null references tags (id),
  primary key (post_id, tag_id)
);

create table post_source (
  id   int generated always as identity primary key,
  post_id int not null references posts (id),
  post_source  text not null
);
