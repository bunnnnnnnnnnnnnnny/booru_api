create table role(
  id              int generated always as identity primary key,
  name            varchar(64) unique not null,
  description     text
);

insert into role (name, description) values
  ('guest', 'A peasant with as few privileges as possible'),
  ('user', 'Should be allowed to disable the default blacklist'),
  ('admin', 'Should be able to use all features and access all content');

create table users(
  id              int generated always as identity primary key,
  role            int references role (id) not null,
  name            varchar(64) unique not null,
  password_hash   text not null,
  avatar_md5      varchar(32),
  email           text,
  bio             text,
  settings        text,
  creation        timestamptz not null default now()
);

create table registration_tokens(
  id              int generated always as identity primary key,
  token           varchar(32) unique not null,
  role            int references role (id) not null,
  expiry          timestamptz not null default date_add(now(), '1 day'::interval),
  name            varchar(64)
);
