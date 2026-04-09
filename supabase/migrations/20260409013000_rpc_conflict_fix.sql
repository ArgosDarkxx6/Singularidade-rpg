begin;

create or replace function public.claim_table_invite(invite_token text)
returns table (
  table_id uuid,
  table_slug text,
  table_name text,
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
    coalesce((select display_name from public.profiles where id = auth.uid()), ''),
    true
  )
  on conflict on constraint table_memberships_unique do update
    set role = excluded.role,
        character_id = excluded.character_id,
        nickname = excluded.nickname,
        active = true,
        updated_at = now()
  returning id into target_membership_id;

  update public.table_invites
  set accepted_at = now()
  where id = invite_record.id;

  return query
  select
    invite_record.table_id,
    t.slug,
    t.name,
    target_membership_id,
    invite_record.role,
    invite_record.character_id
  from public.tables t
  where t.id = invite_record.table_id;
end;
$$;

create or replace function public.claim_join_code(join_code text)
returns table (
  table_id uuid,
  table_slug text,
  table_name text,
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
    code_record.character_id,
    coalesce((select display_name from public.profiles where id = auth.uid()), ''),
    true
  )
  on conflict on constraint table_memberships_unique do update
    set role = excluded.role,
        character_id = excluded.character_id,
        nickname = excluded.nickname,
        active = true,
        updated_at = now()
  returning id into target_membership_id;

  update public.table_join_codes
  set last_used_at = now(),
      updated_at = now()
  where id = code_record.id;

  return query
  select
    code_record.table_id,
    t.slug,
    t.name,
    target_membership_id,
    code_record.role,
    code_record.character_id
  from public.tables t
  where t.id = code_record.table_id;
end;
$$;

create or replace function public.claim_table_invite_v2(invite_token text, session_nickname text default null)
returns table (
  table_id uuid,
  table_slug text,
  table_name text,
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

  update public.table_invites
  set accepted_at = now(),
      updated_at = now()
  where id = invite_record.id;

  return query
  select
    invite_record.table_id,
    t.slug,
    t.name,
    target_membership_id,
    invite_record.role,
    invite_record.character_id
  from public.tables t
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

  resolved_character_id := code_record.character_id;

  if code_record.role = 'player' and resolved_character_id is null then
    resolved_character_id := selected_character_id;
  end if;

  if code_record.role = 'player' and resolved_character_id is null then
    raise exception 'character required';
  end if;

  if resolved_character_id is not null and not exists (
    select 1
    from public.tables t,
    jsonb_array_elements(coalesce(t.state -> 'characters', '[]'::jsonb)) as character_entry(value)
    where t.id = code_record.table_id
      and character_entry.value ->> 'id' = resolved_character_id::text
  ) then
    raise exception 'character not found';
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

  update public.table_join_codes
  set last_used_at = now(),
      updated_at = now()
  where id = code_record.id;

  return query
  select
    code_record.table_id,
    t.slug,
    t.name,
    target_membership_id,
    code_record.role,
    resolved_character_id
  from public.tables t
  where t.id = code_record.table_id;
end;
$$;

commit;
