begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  username citext not null unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  avatar_path text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username::text) between 3 and 24),
  constraint profiles_username_format check (username::text ~ '^[a-z0-9_]+$'),
  constraint profiles_email_not_blank check (length(trim(email)) > 3)
);

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  series_name text not null default 'Jujutsu Kaisen',
  campaign_name text not null default '',
  episode_number text not null default '',
  episode_title text not null default '',
  session_date date,
  location text not null default '',
  status text not null default 'Planejamento',
  expected_roster text not null default '',
  recap text not null default '',
  objective text not null default '',
  meta jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  owner_id uuid references public.profiles(id) on delete set null,
  current_round integer not null default 1,
  current_turn_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tables_slug_format check (slug ~ '^[a-z0-9-]{3,48}$')
);

create table if not exists public.table_memberships (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer',
  character_id uuid,
  nickname text not null default '',
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_memberships_role check (role in ('gm', 'player', 'viewer')),
  constraint table_memberships_unique unique (table_id, user_id)
);

create table if not exists public.table_invites (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  token text not null unique,
  role text not null default 'viewer',
  character_id uuid,
  label text not null default '',
  expires_at timestamptz,
  revoked_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_invites_role check (role in ('gm', 'player', 'viewer'))
);

create table if not exists public.table_join_codes (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  code text not null unique,
  role text not null default 'viewer',
  character_id uuid,
  label text not null default '',
  active boolean not null default true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_join_codes_role check (role in ('gm', 'player', 'viewer')),
  constraint table_join_codes_code_format check (code ~ '^[0-9]{6}$')
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  age integer not null default 0,
  clan text not null default '',
  grade text not null default '',
  appearance text not null default '',
  identity_scar text not null default '',
  identity_anchor text not null default '',
  identity_trigger text not null default '',
  avatar_url text not null default '',
  avatar_path text not null default '',
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint characters_age check (age >= 0)
);

alter table public.table_memberships
  add constraint table_memberships_character_id_fkey
  foreign key (character_id) references public.characters(id) on delete set null;

alter table public.table_invites
  add constraint table_invites_character_id_fkey
  foreign key (character_id) references public.characters(id) on delete set null;

alter table public.table_join_codes
  add constraint table_join_codes_character_id_fkey
  foreign key (character_id) references public.characters(id) on delete set null;

create table if not exists public.character_resources (
  character_id uuid not null references public.characters(id) on delete cascade,
  resource_key text not null,
  current_value integer not null default 0,
  max_value integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (character_id, resource_key),
  constraint character_resources_key check (resource_key in ('hp', 'energy', 'sanity'))
);

create table if not exists public.character_attributes (
  character_id uuid not null references public.characters(id) on delete cascade,
  attribute_key text not null,
  value integer not null default 0,
  rank text not null default 'C',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (character_id, attribute_key),
  constraint character_attributes_key check (attribute_key in ('strength', 'resistance', 'dexterity', 'speed', 'fight', 'precision', 'intelligence', 'charisma')),
  constraint character_attributes_rank check (rank in ('C', 'B', 'A', 'S', 'SS', 'SSS'))
);

create table if not exists public.character_weapons (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  grade text not null default '',
  damage text not null default '',
  tags text[] not null default '{}'::text[],
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_techniques (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  cost integer not null default 0,
  damage text not null default '',
  technique_type text not null default 'Ofensiva',
  tags text[] not null default '{}'::text[],
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_passives (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  tags text[] not null default '{}'::text[],
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_vows (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  benefit text not null default '',
  restriction text not null default '',
  penalty text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_inventory_items (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  effect text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint character_inventory_items_quantity check (quantity >= 1)
);

create table if not exists public.character_conditions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  color text not null default 'purple',
  note text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint character_conditions_color check (color in ('purple', 'red', 'blue', 'green', 'gray'))
);

create table if not exists public.order_entries (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  entry_type text not null default 'pc',
  name text not null,
  initiative integer,
  modifier integer not null default 0,
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_entries_type check (entry_type in ('pc', 'npc'))
);

create table if not exists public.table_logs (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  category text not null default 'Sistema',
  title text not null default '',
  body text not null default '',
  meta text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.table_snapshots (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  label text not null default '',
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tables_owner_id on public.tables(owner_id);
create index if not exists idx_table_memberships_table_id on public.table_memberships(table_id);
create index if not exists idx_table_memberships_user_id on public.table_memberships(user_id);
create index if not exists idx_table_invites_table_id on public.table_invites(table_id);
create index if not exists idx_table_join_codes_table_id on public.table_join_codes(table_id);
create index if not exists idx_characters_table_id on public.characters(table_id);
create index if not exists idx_character_weapons_character_id on public.character_weapons(character_id);
create index if not exists idx_character_techniques_character_id on public.character_techniques(character_id);
create index if not exists idx_character_passives_character_id on public.character_passives(character_id);
create index if not exists idx_character_vows_character_id on public.character_vows(character_id);
create index if not exists idx_character_inventory_items_character_id on public.character_inventory_items(character_id);
create index if not exists idx_character_conditions_character_id on public.character_conditions(character_id);
create index if not exists idx_order_entries_table_id on public.order_entries(table_id);
create index if not exists idx_table_logs_table_id on public.table_logs(table_id);
create index if not exists idx_table_snapshots_table_id on public.table_snapshots(table_id, created_at desc);
