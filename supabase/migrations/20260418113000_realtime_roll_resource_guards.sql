begin;

alter table public.table_logs
  add column if not exists event_kind text not null default 'generic',
  add column if not exists actor_membership_id uuid references public.table_memberships(id) on delete set null,
  add column if not exists character_id uuid references public.characters(id) on delete set null,
  add column if not exists payload jsonb not null default '{}'::jsonb;

create index if not exists idx_table_logs_event_kind on public.table_logs(table_id, event_kind, created_at desc);
create index if not exists idx_table_logs_character_id on public.table_logs(character_id, created_at desc);
create index if not exists idx_character_resources_character_key on public.character_resources(character_id, resource_key);

create or replace function public.adjust_character_resource_current(
  p_table_id uuid,
  p_character_id uuid,
  p_resource_key text,
  p_delta integer
)
returns table (
  character_id uuid,
  resource_key text,
  current_value integer,
  max_value integer,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_record public.table_memberships%rowtype;
  normalized_key text;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  normalized_key := lower(trim(coalesce(p_resource_key, '')));
  if normalized_key not in ('hp', 'energy', 'sanity') then
    raise exception 'invalid resource key';
  end if;

  select *
  into membership_record
  from public.table_memberships tm
  where tm.table_id = p_table_id
    and tm.user_id = auth.uid()
    and tm.active = true
  order by tm.updated_at desc
  limit 1;

  if not found then
    raise exception 'membership not found';
  end if;

  if membership_record.role = 'viewer' then
    raise exception 'viewer cannot modify character resources';
  end if;

  if membership_record.role = 'player'
     and (membership_record.character_id is null or membership_record.character_id is distinct from p_character_id) then
    raise exception 'player cannot modify another character';
  end if;

  if not exists (
    select 1
    from public.characters c
    where c.id = p_character_id
      and c.table_id = p_table_id
      and coalesce(c.archived, false) = false
  ) then
    raise exception 'character not found in table';
  end if;

  return query
  with updated as (
    update public.character_resources cr
    set current_value = greatest(0, least(cr.max_value, cr.current_value + coalesce(p_delta, 0))),
        updated_at = now()
    where cr.character_id = p_character_id
      and cr.resource_key = normalized_key
    returning cr.character_id, cr.resource_key, cr.current_value, cr.max_value, cr.updated_at
  )
  select updated.character_id, updated.resource_key, updated.current_value, updated.max_value, updated.updated_at
  from updated;

  if not found then
    raise exception 'resource row not found';
  end if;
end;
$$;

create or replace function public.record_table_roll_event(
  p_table_id uuid,
  p_character_id uuid,
  p_title text,
  p_body text,
  p_meta text default '',
  p_payload jsonb default '{}'::jsonb,
  p_category text default 'Rolagem'
)
returns table (
  log_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_record public.table_memberships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  select *
  into membership_record
  from public.table_memberships tm
  where tm.table_id = p_table_id
    and tm.user_id = auth.uid()
    and tm.active = true
  order by tm.updated_at desc
  limit 1;

  if not found then
    raise exception 'membership not found';
  end if;

  if membership_record.role = 'viewer' then
    raise exception 'viewer cannot record rolls';
  end if;

  if membership_record.role = 'player'
     and (membership_record.character_id is null or membership_record.character_id is distinct from p_character_id) then
    raise exception 'player cannot roll with another character';
  end if;

  if not exists (
    select 1
    from public.characters c
    where c.id = p_character_id
      and c.table_id = p_table_id
      and coalesce(c.archived, false) = false
  ) then
    raise exception 'character not found in table';
  end if;

  return query
  insert into public.table_logs (
    table_id,
    actor_id,
    actor_membership_id,
    character_id,
    category,
    title,
    body,
    meta,
    event_kind,
    payload,
    created_at
  )
  values (
    p_table_id,
    auth.uid(),
    membership_record.id,
    p_character_id,
    coalesce(nullif(trim(p_category), ''), 'Rolagem'),
    coalesce(p_title, ''),
    coalesce(p_body, ''),
    coalesce(p_meta, ''),
    'roll',
    coalesce(p_payload, '{}'::jsonb),
    now()
  )
  returning id, public.table_logs.created_at;
end;
$$;

grant execute on function public.adjust_character_resource_current(uuid, uuid, text, integer) to authenticated;
grant execute on function public.record_table_roll_event(uuid, uuid, text, text, text, jsonb, text) to authenticated;

commit;
