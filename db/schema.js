// SOIL magazine schema. Idempotent: run on every cold start by ensureSchema() in lib/db.js.
export const schema = `
-- SOIL magazine schema. Idempotent: safe to run on every deploy or cold start.

create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists contributors (
  id         serial primary key,
  slug       text not null unique,
  name       text not null,
  role       text not null default '',          -- e.g. Writer, Photographer, Editor
  bio        text not null default '',
  photo_url  text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists issues (
  id             serial primary key,
  number         integer not null unique,
  season         text not null,                 -- e.g. Spring 2026
  strap          text not null default '',      -- line under the issue eyebrow on the homepage
  status         text not null default 'draft' check (status in ('draft', 'published')),
  is_current     boolean not null default false,
  cover_story_id integer,
  cover_kicker   text not null default 'Cover Story',
  highlight_ids  integer[] not null default '{}', -- "In This Issue" sidebar, in order
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists issues_one_current on issues (is_current) where is_current;

create table if not exists stories (
  id           serial primary key,
  slug         text not null unique,
  title        text not null,                   -- inline markup: *em*, **한글**
  dek          text not null default '',
  section      text not null default 'home' check (section in ('dress', 'food', 'home')),
  category     text not null default '',        -- e.g. Literature, Craft
  kind         text not null default '',        -- e.g. Interview, Essay
  read_minutes integer,                         -- manual override; otherwise counted from the body
  credit       text not null default '',        -- e.g. Photographs from the archive
  issue_id     integer references issues(id) on delete set null,
  position     integer not null default 0,      -- order within its section
  art          text not null default '',        -- drawn fallback illustration
  photos       jsonb not null default '[]',     -- candidate image URLs, first that loads wins
  photo_alt    text not null default '',
  body         jsonb not null default '[]',     -- blocks, see lib/blocks.js
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists stories_issue on stories (issue_id, section, position);

do $$ begin
  alter table issues add constraint issues_cover_fk
    foreign key (cover_story_id) references stories(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists story_contributors (
  story_id       integer not null references stories(id) on delete cascade,
  contributor_id integer not null references contributors(id) on delete cascade,
  position       integer not null default 0,
  primary key (story_id, contributor_id)
);

create table if not exists subscribers (
  id              serial primary key,
  email           text not null,
  status          text not null default 'active' check (status in ('active', 'unsubscribed')),
  token           text not null unique,         -- for unsubscribe links
  source          text not null default 'site',
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create unique index if not exists subscribers_email on subscribers (lower(email));

create table if not exists letters (
  id              serial primary key,
  subject         text not null default '',
  preheader       text not null default '',     -- preview text shown in the inbox
  body            jsonb not null default '[]',
  status          text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  recipient_count integer not null default 0,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists letter_sends (
  letter_id     integer not null references letters(id) on delete cascade,
  subscriber_id integer not null references subscribers(id) on delete cascade,
  status        text not null default 'sent' check (status in ('sent', 'failed', 'logged')),
  provider_id   text not null default '',
  error         text not null default '',
  sent_at       timestamptz not null default now(),
  primary key (letter_id, subscriber_id)
);

create table if not exists login_attempts (
  ip         text not null,
  at         timestamptz not null default now()
);
create index if not exists login_attempts_ip on login_attempts (ip, at);
`;
