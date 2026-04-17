begin;

alter table public.tables
  add column if not exists system_key text not null default 'singularidade';

update public.tables
set system_key = coalesce(nullif(meta ->> 'systemKey', ''), 'singularidade')
where system_key is null or system_key = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tables_system_key_format'
      and conrelid = 'public.tables'::regclass
  ) then
    alter table public.tables
      add constraint tables_system_key_format
      check (system_key ~ '^[a-z0-9][a-z0-9-]*$');
  end if;
end
$$;

create index if not exists tables_system_key_idx on public.tables(system_key);

drop function if exists public.resolve_join_code(text);
drop function if exists public.claim_table_invite_v2(text, text);
drop function if exists public.claim_join_code_v2(text, text, uuid);

create or replace function public.resolve_join_code(join_code text)
returns table (
  table_id uuid,
  table_slug text,
  table_name text,
  system_key text,
  role text,
  character_id uuid,
  requires_character boolean,
  characters jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  code_record public.table_join_codes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  select *
  into code_record
  from public.table_join_codes
  where code = join_code
    and active = true
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'join code not found';
  end if;

  return query
  select
    code_record.table_id,
    t.slug,
    t.name,
    t.system_key,
    code_record.role,
    code_record.character_id,
    (code_record.role = 'player' and code_record.character_id is null) as requires_character,
    case
      when code_record.role = 'player' and code_record.character_id is null then
        coalesce(
          (
            select jsonb_agg(source.item order by source.sort_order)
            from (
              select
                jsonb_build_object(
                  'id', c.id,
                  'name', c.name,
                  'grade', c.grade,
                  'clan', c.clan
                ) as item,
                c.sort_order
              from public.characters as c
              where c.table_id = code_record.table_id
                and c.archived = false
                and (c.owner_id is null or c.owner_id = auth.uid() or c.owner_id = t.owner_id)
            ) as source
          ),
          '[]'::jsonb
        )
      else '[]'::jsonb
    end
  from public.tables as t
  where t.id = code_record.table_id;
end;
$$;

create or replace function public.claim_table_invite_v2(invite_token text, session_nickname text default null)
returns table (
  table_id uuid,
  table_slug text,
  table_name text,
  system_key text,
  membership_id uuid,
  role text,
  character_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.table_invites%rowtype;
  target_membership_id uuid;
  resolved_nickname text;
  current_character_owner uuid;
  table_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  select *
  into invite_record
  from public.table_invites
  where token = invite_token
    and revoked_at is null
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'invite not found';
  end if;

  select t.owner_id
  into table_owner_id
  from public.tables as t
  where t.id = invite_record.table_id;

  if invite_record.role = 'player' and invite_record.character_id is not null then
    select c.owner_id
    into current_character_owner
    from public.characters as c
    where c.id = invite_record.character_id
      and c.table_id = invite_record.table_id
      and c.archived = false
    for update;

    if not found then
      raise exception 'character not found';
    end if;

    if current_character_owner is not null and current_character_owner <> auth.uid() and current_character_owner <> table_owner_id then
      raise exception 'character already claimed';
    end if;
  end if;

  resolved_nickname := nullif(trim(coalesce(session_nickname, '')), '');

  if resolved_nickname is null then
    select coalesce(nullif(trim(display_name), ''), nullif(trim(username::text), ''), 'Feiticeiro')
      into resolved_nickname
    from public.profiles
    where id = auth.uid();
  end if;

  insert into public.table_memberships (
    table_id,
    user_id,
    role,
    character_id,
    nickname,
    active
  )
  values (
    invite_record.table_id,
    auth.uid(),
    invite_record.role,
    invite_record.character_id,
    coalesce(resolved_nickname, 'Feiticeiro'),
    true
  )
  on conflict on constraint table_memberships_unique do update
    set role = excluded.role,
        character_id = coalesce(excluded.character_id, public.table_memberships.character_id),
        nickname = excluded.nickname,
        active = true,
        updated_at = now()
  returning id into target_membership_id;

  if invite_record.role = 'player' and invite_record.character_id is not null then
    update public.characters
    set owner_id = auth.uid(),
        updated_at = now()
    where id = invite_record.character_id
      and table_id = invite_record.table_id
      and (owner_id is null or owner_id = auth.uid() or owner_id = table_owner_id);
  end if;

  update public.table_invites
  set accepted_at = now(),
      updated_at = now()
  where id = invite_record.id;

  return query
  select
    invite_record.table_id,
    t.slug,
    t.name,
    t.system_key,
    target_membership_id,
    invite_record.role,
    invite_record.character_id
  from public.tables as t
  where t.id = invite_record.table_id;
end;
$$;

create or replace function public.claim_join_code_v2(
  join_code text,
  session_nickname text default null,
  selected_character_id uuid default null
)
returns table (
  table_id uuid,
  table_slug text,
  table_name text,
  system_key text,
  membership_id uuid,
  role text,
  character_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  code_record public.table_join_codes%rowtype;
  target_membership_id uuid;
  resolved_nickname text;
  resolved_character_id uuid;
  current_character_owner uuid;
  table_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  select *
  into code_record
  from public.table_join_codes
  where code = join_code
    and active = true
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'join code not found';
  end if;

  select t.owner_id
  into table_owner_id
  from public.tables as t
  where t.id = code_record.table_id;

  resolved_character_id := code_record.character_id;

  if code_record.role = 'player' and resolved_character_id is null then
    resolved_character_id := selected_character_id;
  end if;

  if code_record.role = 'player' and resolved_character_id is null then
    raise exception 'character required';
  end if;

  if resolved_character_id is not null then
    select c.owner_id
    into current_character_owner
    from public.characters as c
    where c.id = resolved_character_id
      and c.table_id = code_record.table_id
      and c.archived = false
    for update;

    if not found then
      raise exception 'character not found';
    end if;

    if code_record.role = 'player' and current_character_owner is not null and current_character_owner <> auth.uid() and current_character_owner <> table_owner_id then
      raise exception 'character already claimed';
    end if;
  end if;

  resolved_nickname := nullif(trim(coalesce(session_nickname, '')), '');

  if resolved_nickname is null then
    select coalesce(nullif(trim(display_name), ''), nullif(trim(username::text), ''), 'Feiticeiro')
      into resolved_nickname
    from public.profiles
    where id = auth.uid();
  end if;

  insert into public.table_memberships (
    table_id,
    user_id,
    role,
    character_id,
    nickname,
    active
  )
  values (
    code_record.table_id,
    auth.uid(),
    code_record.role,
    resolved_character_id,
    coalesce(resolved_nickname, 'Feiticeiro'),
    true
  )
  on conflict on constraint table_memberships_unique do update
    set role = excluded.role,
        character_id = coalesce(excluded.character_id, public.table_memberships.character_id),
        nickname = excluded.nickname,
        active = true,
        updated_at = now()
  returning id into target_membership_id;

  if code_record.role = 'player' and resolved_character_id is not null then
    update public.characters
    set owner_id = auth.uid(),
        updated_at = now()
    where id = resolved_character_id
      and table_id = code_record.table_id
      and (owner_id is null or owner_id = auth.uid() or owner_id = table_owner_id);
  end if;

  update public.table_join_codes
  set last_used_at = now(),
      updated_at = now()
  where id = code_record.id;

  return query
  select
    code_record.table_id,
    t.slug,
    t.name,
    t.system_key,
    target_membership_id,
    code_record.role,
    resolved_character_id
  from public.tables as t
  where t.id = code_record.table_id;
end;
$$;

grant execute on function public.resolve_join_code(text) to authenticated;
grant execute on function public.claim_table_invite_v2(text, text) to authenticated;
grant execute on function public.claim_join_code_v2(text, text, uuid) to authenticated;

commit;
