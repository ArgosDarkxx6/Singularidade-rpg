begin;

create or replace function public.normalize_username(input text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(lower(trim(coalesce(input, ''))), '[^a-z0-9_]+', '', 'g'),
    ''
  );
$$;

create or replace function public.slugify_text(input text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(lower(trim(coalesce(input, ''))), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    ),
    ''
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  incoming_username text;
  incoming_display_name text;
begin
  incoming_username := public.normalize_username(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  if incoming_username is null then
    incoming_username := public.normalize_username(split_part(new.email, '@', 1));
  end if;

  if incoming_username is null then
    raise exception 'username required';
  end if;

  incoming_display_name := trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'displayName',
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  ));

  insert into public.profiles (
    id,
    email,
    username,
    display_name,
    bio,
    avatar_url,
    avatar_path
  )
  values (
    new.id,
    lower(trim(new.email)),
    incoming_username,
    incoming_display_name,
    '',
    '',
    ''
  )
  on conflict (id) do update
    set email = excluded.email,
        username = excluded.username,
        display_name = excluded.display_name,
        updated_at = now();

  return new;
end;
$$;

create or replace function public.is_table_member(table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.table_memberships tm
    where tm.table_id = is_table_member.table_id
      and tm.user_id = auth.uid()
      and tm.active = true
  );
$$;

create or replace function public.is_table_gm(table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.table_memberships tm
    where tm.table_id = is_table_gm.table_id
      and tm.user_id = auth.uid()
      and tm.active = true
      and tm.role = 'gm'
  );
$$;

create or replace function public.can_manage_table(table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_table_gm(can_manage_table.table_id)
     or exists (
       select 1
       from public.tables t
       where t.id = can_manage_table.table_id
         and t.owner_id = auth.uid()
     );
$$;

create or replace function public.can_play_table(table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.table_memberships tm
    where tm.table_id = can_play_table.table_id
      and tm.user_id = auth.uid()
      and tm.active = true
      and tm.role in ('gm', 'player')
  );
$$;

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

create trigger auth_users_create_profile
after insert on auth.users
for each row execute function public.handle_new_user();

commit;
