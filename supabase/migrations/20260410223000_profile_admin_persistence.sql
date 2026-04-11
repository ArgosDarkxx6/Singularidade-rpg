begin;

alter table public.characters
  alter column table_id drop not null;

alter table public.characters
  drop constraint if exists characters_table_id_fkey;

alter table public.characters
  add constraint characters_table_id_fkey
  foreign key (table_id) references public.tables(id) on delete set null;

create index if not exists idx_characters_owner_id on public.characters(owner_id);

create or replace function public.can_view_character(character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.characters c
    where c.id = can_view_character.character_id
      and (
        c.owner_id = auth.uid()
        or (c.table_id is not null and public.is_table_member(c.table_id))
        or (c.table_id is not null and public.can_manage_table(c.table_id))
      )
  );
$$;

create or replace function public.can_manage_character(character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.characters c
    where c.id = can_manage_character.character_id
      and (
        c.owner_id = auth.uid()
        or (c.table_id is not null and public.can_manage_table(c.table_id))
      )
  );
$$;

create or replace function public.leave_table(p_table_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_membership public.table_memberships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  select *
  into current_membership
  from public.table_memberships
  where table_id = p_table_id
    and user_id = auth.uid()
    and active = true
  limit 1;

  if not found then
    return;
  end if;

  update public.table_memberships
  set active = false,
      updated_at = now()
  where id = current_membership.id;
end;
$$;

drop policy if exists "Characters are visible to table members" on public.characters;
drop policy if exists "Characters can be created by players or managers" on public.characters;
drop policy if exists "Characters can be updated by the owner or managers" on public.characters;
drop policy if exists "Characters can be deleted by the owner or managers" on public.characters;

create policy "Characters are visible to owners or table members"
on public.characters
for select
to authenticated
using (
  owner_id = auth.uid()
  or (table_id is not null and public.is_table_member(table_id))
  or (table_id is not null and public.can_manage_table(table_id))
);

create policy "Characters can be created by owners, players or managers"
on public.characters
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and (table_id is null or public.can_play_table(table_id) or public.can_manage_table(table_id))
);

create policy "Characters can be updated by the owner or managers"
on public.characters
for update
to authenticated
using (
  owner_id = auth.uid()
  or (table_id is not null and public.can_manage_table(table_id))
)
with check (
  owner_id = auth.uid()
  or (table_id is not null and public.can_manage_table(table_id))
);

create policy "Characters can be deleted by the owner or managers"
on public.characters
for delete
to authenticated
using (
  owner_id = auth.uid()
  or (table_id is not null and public.can_manage_table(table_id))
);

drop policy if exists "Character resources are visible to table members" on public.character_resources;
drop policy if exists "Character resources can be managed by owners or managers" on public.character_resources;
drop policy if exists "Character attributes are visible to table members" on public.character_attributes;
drop policy if exists "Character attributes can be managed by owners or managers" on public.character_attributes;
drop policy if exists "Character weapons are visible to table members" on public.character_weapons;
drop policy if exists "Character weapons can be managed by owners or managers" on public.character_weapons;
drop policy if exists "Character techniques are visible to table members" on public.character_techniques;
drop policy if exists "Character techniques can be managed by owners or managers" on public.character_techniques;
drop policy if exists "Character passives are visible to table members" on public.character_passives;
drop policy if exists "Character passives can be managed by owners or managers" on public.character_passives;
drop policy if exists "Character vows are visible to table members" on public.character_vows;
drop policy if exists "Character vows can be managed by owners or managers" on public.character_vows;
drop policy if exists "Character inventory is visible to table members" on public.character_inventory_items;
drop policy if exists "Character inventory can be managed by owners or managers" on public.character_inventory_items;
drop policy if exists "Character conditions are visible to table members" on public.character_conditions;
drop policy if exists "Character conditions can be managed by owners or managers" on public.character_conditions;

create policy "Character resources are visible to owners or table members"
on public.character_resources
for select
to authenticated
using (public.can_view_character(character_id));

create policy "Character resources can be managed by owners or managers"
on public.character_resources
for all
to authenticated
using (public.can_manage_character(character_id))
with check (public.can_manage_character(character_id));

create policy "Character attributes are visible to owners or table members"
on public.character_attributes
for select
to authenticated
using (public.can_view_character(character_id));

create policy "Character attributes can be managed by owners or managers"
on public.character_attributes
for all
to authenticated
using (public.can_manage_character(character_id))
with check (public.can_manage_character(character_id));

create policy "Character weapons are visible to owners or table members"
on public.character_weapons
for select
to authenticated
using (public.can_view_character(character_id));

create policy "Character weapons can be managed by owners or managers"
on public.character_weapons
for all
to authenticated
using (public.can_manage_character(character_id))
with check (public.can_manage_character(character_id));

create policy "Character techniques are visible to owners or table members"
on public.character_techniques
for select
to authenticated
using (public.can_view_character(character_id));

create policy "Character techniques can be managed by owners or managers"
on public.character_techniques
for all
to authenticated
using (public.can_manage_character(character_id))
with check (public.can_manage_character(character_id));

create policy "Character passives are visible to owners or table members"
on public.character_passives
for select
to authenticated
using (public.can_view_character(character_id));

create policy "Character passives can be managed by owners or managers"
on public.character_passives
for all
to authenticated
using (public.can_manage_character(character_id))
with check (public.can_manage_character(character_id));

create policy "Character vows are visible to owners or table members"
on public.character_vows
for select
to authenticated
using (public.can_view_character(character_id));

create policy "Character vows can be managed by owners or managers"
on public.character_vows
for all
to authenticated
using (public.can_manage_character(character_id))
with check (public.can_manage_character(character_id));

create policy "Character inventory is visible to owners or table members"
on public.character_inventory_items
for select
to authenticated
using (public.can_view_character(character_id));

create policy "Character inventory can be managed by owners or managers"
on public.character_inventory_items
for all
to authenticated
using (public.can_manage_character(character_id))
with check (public.can_manage_character(character_id));

create policy "Character conditions are visible to owners or table members"
on public.character_conditions
for select
to authenticated
using (public.can_view_character(character_id));

create policy "Character conditions can be managed by owners or managers"
on public.character_conditions
for all
to authenticated
using (public.can_manage_character(character_id))
with check (public.can_manage_character(character_id));

create or replace function public.guard_table_owner_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id
     and current_setting('app.allow_table_owner_change', true) <> '1' then
    raise exception 'owner_id can only be changed through transfer_table_ownership';
  end if;

  return new;
end;
$$;

drop trigger if exists tables_guard_owner_change on public.tables;

create trigger tables_guard_owner_change
before update on public.tables
for each row execute function public.guard_table_owner_change();

create or replace function public.transfer_table_ownership(
  p_table_id uuid,
  p_target_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  table_record public.tables%rowtype;
  target_membership public.table_memberships%rowtype;
  previous_owner_membership_id uuid;
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
    raise exception 'only the table owner can transfer administration';
  end if;

  select *
  into target_membership
  from public.table_memberships
  where id = p_target_membership_id
    and table_id = p_table_id
    and active = true
  for update;

  if not found then
    raise exception 'target membership not found';
  end if;

  if target_membership.user_id = auth.uid() then
    raise exception 'choose another member';
  end if;

  select tm.id
  into previous_owner_membership_id
  from public.table_memberships tm
  where tm.table_id = p_table_id
    and tm.user_id = auth.uid()
    and tm.active = true
  limit 1;

  perform set_config('app.allow_table_owner_change', '1', true);

  update public.tables
  set owner_id = target_membership.user_id,
      updated_at = now()
  where id = p_table_id;

  update public.table_memberships
  set role = 'gm',
      updated_at = now()
  where id = target_membership.id;

  if previous_owner_membership_id is not null then
    update public.table_memberships
    set role = 'gm',
        updated_at = now()
    where id = previous_owner_membership_id;
  end if;

  insert into public.table_logs (
    table_id,
    actor_id,
    category,
    title,
    body,
    meta
  )
  values (
    p_table_id,
    auth.uid(),
    'system',
    'Administracao transferida',
    'A posse principal da mesa foi transferida para outro membro ativo.',
    coalesce(target_membership.nickname, '')
  );
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

  update public.characters
  set table_id = null,
      updated_at = now()
  where table_id = p_table_id
    and owner_id is not null;

  delete from public.characters
  where table_id = p_table_id
    and owner_id is null;

  delete from public.tables
  where id = p_table_id;
end;
$$;

grant execute on function public.leave_table(uuid) to authenticated;
grant execute on function public.transfer_table_ownership(uuid, uuid) to authenticated;
grant execute on function public.delete_table_preserving_characters(uuid) to authenticated;

commit;
