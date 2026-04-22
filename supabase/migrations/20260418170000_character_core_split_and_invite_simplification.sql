begin;

create table if not exists public.character_cores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default '',
  age integer not null default 0,
  clan text not null default '',
  grade text not null default '',
  appearance text not null default '',
  lore text not null default '',
  avatar_url text not null default '',
  avatar_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint character_cores_age_nonnegative check (age >= 0)
);

create index if not exists idx_character_cores_owner_id on public.character_cores(owner_id);
create index if not exists idx_character_cores_updated_at on public.character_cores(owner_id, updated_at desc);

alter table public.character_cores enable row level security;

alter table public.characters
  add column if not exists core_id uuid references public.character_cores(id) on delete set null;

create index if not exists idx_characters_core_id on public.characters(core_id);

drop trigger if exists character_cores_touch_updated_at on public.character_cores;
create trigger character_cores_touch_updated_at
before update on public.character_cores
for each row execute function public.touch_updated_at();

drop policy if exists "Character cores are visible to owner and linked table members" on public.character_cores;
create policy "Character cores are visible to owner and linked table members"
on public.character_cores
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.characters c
    where c.core_id = character_cores.id
      and c.table_id is not null
      and public.is_table_member(c.table_id)
  )
);

drop policy if exists "Character cores can be inserted by owner" on public.character_cores;
create policy "Character cores can be inserted by owner"
on public.character_cores
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Character cores can be updated by owner" on public.character_cores;
create policy "Character cores can be updated by owner"
on public.character_cores
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Character cores can be deleted by owner" on public.character_cores;
create policy "Character cores can be deleted by owner"
on public.character_cores
for delete
to authenticated
using (owner_id = auth.uid());

insert into public.character_cores (
  id,
  owner_id,
  name,
  age,
  clan,
  grade,
  appearance,
  lore,
  avatar_url,
  avatar_path,
  created_at,
  updated_at
)
select
  c.id,
  c.owner_id,
  c.name,
  c.age,
  c.clan,
  c.grade,
  c.appearance,
  coalesce(c.lore, ''),
  c.avatar_url,
  c.avatar_path,
  c.created_at,
  c.updated_at
from public.characters c
where c.owner_id is not null
  and c.core_id is null
on conflict (id) do nothing;

update public.characters c
set core_id = c.id
where c.owner_id is not null
  and c.core_id is null
  and exists (
    select 1
    from public.character_cores cc
    where cc.id = c.id
  );

create table if not exists public.table_characters (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  core_id uuid not null references public.character_cores(id) on delete cascade,
  character_id uuid not null unique references public.characters(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_characters_unique_core_per_table unique (table_id, core_id)
);

create index if not exists idx_table_characters_table_id on public.table_characters(table_id);
create index if not exists idx_table_characters_core_id on public.table_characters(core_id);
create index if not exists idx_table_characters_owner_id on public.table_characters(owner_id);

alter table public.table_characters enable row level security;

drop trigger if exists table_characters_touch_updated_at on public.table_characters;
create trigger table_characters_touch_updated_at
before update on public.table_characters
for each row execute function public.touch_updated_at();

drop policy if exists "Table characters are visible to table members" on public.table_characters;
create policy "Table characters are visible to table members"
on public.table_characters
for select
to authenticated
using (public.is_table_member(table_id));

drop policy if exists "Table characters can be managed by owner and table managers" on public.table_characters;
create policy "Table characters can be managed by owner and table managers"
on public.table_characters
for all
to authenticated
using (owner_id = auth.uid() or public.can_manage_table(table_id))
with check (owner_id = auth.uid() or public.can_manage_table(table_id));

insert into public.table_characters (table_id, core_id, character_id, owner_id)
select
  c.table_id,
  c.core_id,
  c.id,
  c.owner_id
from public.characters c
where c.table_id is not null
  and c.core_id is not null
  and coalesce(c.archived, false) = false
on conflict (character_id) do update
set
  table_id = excluded.table_id,
  core_id = excluded.core_id,
  owner_id = excluded.owner_id,
  updated_at = now();

alter table public.table_invites
  add column if not exists kind text not null default 'link';

alter table public.table_join_codes
  add column if not exists kind text not null default 'code';

alter table public.table_invites
  drop constraint if exists table_invites_kind_check;
alter table public.table_invites
  add constraint table_invites_kind_check check (kind in ('link'));

alter table public.table_join_codes
  drop constraint if exists table_join_codes_kind_check;
alter table public.table_join_codes
  add constraint table_join_codes_kind_check check (kind in ('code'));

grant select, insert, update, delete on public.character_cores to authenticated;
grant select, insert, update, delete on public.table_characters to authenticated;

commit;
