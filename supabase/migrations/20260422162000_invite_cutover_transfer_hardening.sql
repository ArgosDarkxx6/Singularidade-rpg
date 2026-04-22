begin;

alter table public.table_invites
  drop column if exists character_id,
  drop column if exists label;

alter table public.table_join_codes
  drop column if exists character_id,
  drop column if exists label;

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
    null::uuid,
    false,
    '[]'::jsonb
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
    null,
    coalesce(resolved_nickname, 'Feiticeiro'),
    true
  )
  on conflict on constraint table_memberships_unique do update
    set role = excluded.role,
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
    t.system_key,
    target_membership_id,
    invite_record.role,
    null::uuid
  from public.tables as t
  where t.id = invite_record.table_id;
end;
$$;

create or replace function public.claim_join_code_v2(
  join_code text,
  session_nickname text default null
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
    null,
    coalesce(resolved_nickname, 'Feiticeiro'),
    true
  )
  on conflict on constraint table_memberships_unique do update
    set role = excluded.role,
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
    t.system_key,
    target_membership_id,
    code_record.role,
    null::uuid
  from public.tables as t
  where t.id = code_record.table_id;
end;
$$;

create or replace function public.transfer_character_core_ownership(
  p_core_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  core_record public.character_cores%rowtype;
  linked record;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  if p_target_user_id is null then
    raise exception 'target user required';
  end if;

  if p_target_user_id = auth.uid() then
    raise exception 'target must be another user';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_target_user_id
  ) then
    raise exception 'target user not found';
  end if;

  select *
  into core_record
  from public.character_cores
  where id = p_core_id
  for update;

  if not found then
    raise exception 'character core not found';
  end if;

  if core_record.owner_id is distinct from auth.uid() then
    raise exception 'only the owner can transfer this character';
  end if;

  update public.character_cores
  set owner_id = p_target_user_id,
      updated_at = now()
  where id = p_core_id;

  for linked in
    select c.id as character_id, c.table_id
    from public.characters c
    where c.core_id = p_core_id
    for update
  loop
    update public.characters
    set owner_id = p_target_user_id,
        updated_at = now()
    where id = linked.character_id;

    if linked.table_id is null then
      continue;
    end if;

    insert into public.table_characters (table_id, core_id, character_id, owner_id)
    values (linked.table_id, p_core_id, linked.character_id, p_target_user_id)
    on conflict (character_id) do update
      set owner_id = excluded.owner_id,
          updated_at = now();

    update public.table_memberships
    set character_id = null,
        updated_at = now()
    where table_id = linked.table_id
      and user_id = auth.uid()
      and active = true
      and character_id = linked.character_id;

    update public.table_memberships as tm
    set character_id = linked.character_id,
        updated_at = now()
    where tm.id = (
      select target.id
      from public.table_memberships as target
      where target.table_id = linked.table_id
        and target.user_id = p_target_user_id
        and target.active = true
        and (target.character_id is null or target.character_id = linked.character_id)
      order by target.updated_at desc nulls last, target.joined_at desc nulls last
      limit 1
    );
  end loop;
end;
$$;

create or replace function public.delete_table_preserving_characters(p_table_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  table_record public.tables%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  select *
  into table_record
  from public.tables
  where id = p_table_id
  for update;

  if not found then
    raise exception 'table not found';
  end if;

  if table_record.owner_id is distinct from auth.uid() then
    raise exception 'only the table owner can delete this table';
  end if;

  delete from public.tables
  where id = p_table_id;
end;
$$;

grant execute on function public.resolve_join_code(text) to authenticated;
grant execute on function public.claim_table_invite_v2(text, text) to authenticated;
grant execute on function public.claim_join_code_v2(text, text) to authenticated;
grant execute on function public.transfer_character_core_ownership(uuid, uuid) to authenticated;
grant execute on function public.delete_table_preserving_characters(uuid) to authenticated;

commit;
