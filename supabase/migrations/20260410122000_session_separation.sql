begin;

alter table public.tables
  add column if not exists description text not null default '',
  add column if not exists slot_count integer not null default 0,
  add column if not exists current_session_id uuid;

create table if not exists public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  episode_number text not null default '',
  episode_title text not null default '',
  status text not null default 'Planejamento',
  session_date date,
  location text not null default '',
  objective text not null default '',
  recap text not null default '',
  notes text not null default '',
  is_active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_sessions_status_not_blank check (length(trim(status)) > 0)
);

create table if not exists public.table_session_attendances (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.table_sessions(id) on delete cascade,
  membership_id uuid not null references public.table_memberships(id) on delete cascade,
  status text not null default 'pending',
  marked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_session_attendances_status check (status in ('pending', 'present', 'absent')),
  constraint table_session_attendances_unique unique (session_id, membership_id)
);

create unique index if not exists table_sessions_one_active_idx on public.table_sessions(table_id) where is_active;
create index if not exists table_sessions_table_id_idx on public.table_sessions(table_id);
create index if not exists table_sessions_active_idx on public.table_sessions(table_id, is_active);
create index if not exists table_session_attendances_session_id_idx on public.table_session_attendances(session_id);
create index if not exists table_session_attendances_membership_id_idx on public.table_session_attendances(membership_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tables_current_session_id_fkey'
  ) then
    alter table public.tables
      add constraint tables_current_session_id_fkey
      foreign key (current_session_id) references public.table_sessions(id) on delete set null;
  end if;
end
$$;

alter table public.table_sessions enable row level security;
alter table public.table_session_attendances enable row level security;

create trigger table_sessions_touch_updated_at
before update on public.table_sessions
for each row execute function public.touch_updated_at();

create trigger table_session_attendances_touch_updated_at
before update on public.table_session_attendances
for each row execute function public.touch_updated_at();

create or replace function public.can_manage_session(session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.table_sessions s
    where s.id = can_manage_session.session_id
      and public.can_manage_table(s.table_id)
  );
$$;

create or replace function public.can_view_session(session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.table_sessions s
    where s.id = can_view_session.session_id
      and (public.is_table_member(s.table_id) or public.can_manage_table(s.table_id))
  );
$$;

drop policy if exists "Game sessions are visible to table peers" on public.table_sessions;
drop policy if exists "Game sessions can be created by managers" on public.table_sessions;
drop policy if exists "Game sessions can be updated by managers" on public.table_sessions;
drop policy if exists "Game sessions can be deleted by managers" on public.table_sessions;

create policy "Game sessions are visible to table peers"
on public.table_sessions
for select
to authenticated
using (public.can_view_session(id));

create policy "Game sessions can be created by managers"
on public.table_sessions
for insert
to authenticated
with check (public.can_manage_table(table_id));

create policy "Game sessions can be updated by managers"
on public.table_sessions
for update
to authenticated
using (public.can_manage_table(table_id))
with check (public.can_manage_table(table_id));

create policy "Game sessions can be deleted by managers"
on public.table_sessions
for delete
to authenticated
using (public.can_manage_table(table_id));

drop policy if exists "Session attendances are visible to table peers" on public.table_session_attendances;
drop policy if exists "Session attendances can be created by managers or owners" on public.table_session_attendances;
drop policy if exists "Session attendances can be updated by managers or owners" on public.table_session_attendances;
drop policy if exists "Session attendances can be deleted by managers or owners" on public.table_session_attendances;

create policy "Session attendances are visible to table peers"
on public.table_session_attendances
for select
to authenticated
using (public.can_view_session(session_id));

create policy "Session attendances can be created by managers or owners"
on public.table_session_attendances
for insert
to authenticated
with check (
  public.can_manage_session(session_id)
  or exists (
    select 1
    from public.table_memberships tm
    where tm.id = membership_id
      and tm.user_id = auth.uid()
      and tm.active = true
  )
);

create policy "Session attendances can be updated by managers or owners"
on public.table_session_attendances
for update
to authenticated
using (
  public.can_manage_session(session_id)
  or exists (
    select 1
    from public.table_memberships tm
    where tm.id = membership_id
      and tm.user_id = auth.uid()
      and tm.active = true
  )
)
with check (
  public.can_manage_session(session_id)
  or exists (
    select 1
    from public.table_memberships tm
    where tm.id = membership_id
      and tm.user_id = auth.uid()
      and tm.active = true
  )
);

create policy "Session attendances can be deleted by managers or owners"
on public.table_session_attendances
for delete
to authenticated
using (
  public.can_manage_session(session_id)
  or exists (
    select 1
    from public.table_memberships tm
    where tm.id = membership_id
      and tm.user_id = auth.uid()
      and tm.active = true
  )
);

with legacy_sessions as (
  select
    t.id as table_id,
    coalesce(nullif(trim(t.episode_number), ''), '') as episode_number,
    coalesce(nullif(trim(t.episode_title), ''), '') as episode_title,
    coalesce(nullif(trim(t.status), ''), 'Planejamento') as status,
    t.session_date,
    coalesce(nullif(trim(t.location), ''), '') as location,
    coalesce(nullif(trim(t.objective), ''), '') as objective,
    coalesce(nullif(trim(t.recap), ''), '') as recap,
    (coalesce(nullif(trim(t.status), ''), 'Planejamento') = 'Em sessão') as is_active,
    t.owner_id as created_by
  from public.tables t
  where not exists (
    select 1
    from public.table_sessions s
    where s.table_id = t.id
  )
), inserted_sessions as (
  insert into public.table_sessions (
    table_id,
    episode_number,
    episode_title,
    status,
    session_date,
    location,
    objective,
    recap,
    notes,
    is_active,
    created_by
  )
  select
    table_id,
    episode_number,
    episode_title,
    status,
    session_date,
    location,
    objective,
    recap,
    '',
    is_active,
    created_by
  from legacy_sessions
  returning id, table_id
)
update public.tables t
set current_session_id = inserted_sessions.id
from inserted_sessions
where t.id = inserted_sessions.table_id
  and t.current_session_id is null;

with latest_sessions as (
  select distinct on (table_id)
    table_id,
    id
  from public.table_sessions
  order by table_id, is_active desc, created_at desc, updated_at desc
)
update public.tables t
set current_session_id = latest_sessions.id
from latest_sessions
where t.id = latest_sessions.table_id
  and t.current_session_id is null;

insert into public.table_session_attendances (
  session_id,
  membership_id,
  status,
  marked_at
)
select
  s.id,
  tm.id,
  'pending',
  now()
from public.table_sessions s
join public.table_memberships tm on tm.table_id = s.table_id and tm.active = true
where not exists (
  select 1
  from public.table_session_attendances a
  where a.session_id = s.id
    and a.membership_id = tm.id
);

commit;
