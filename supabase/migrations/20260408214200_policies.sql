begin;

alter table public.profiles enable row level security;
alter table public.tables enable row level security;
alter table public.table_memberships enable row level security;
alter table public.table_invites enable row level security;
alter table public.table_join_codes enable row level security;
alter table public.characters enable row level security;
alter table public.character_resources enable row level security;
alter table public.character_attributes enable row level security;
alter table public.character_weapons enable row level security;
alter table public.character_techniques enable row level security;
alter table public.character_passives enable row level security;
alter table public.character_vows enable row level security;
alter table public.character_inventory_items enable row level security;
alter table public.character_conditions enable row level security;
alter table public.order_entries enable row level security;
alter table public.table_logs enable row level security;
alter table public.table_snapshots enable row level security;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger tables_touch_updated_at
before update on public.tables
for each row execute function public.touch_updated_at();

create trigger memberships_touch_updated_at
before update on public.table_memberships
for each row execute function public.touch_updated_at();

create trigger invites_touch_updated_at
before update on public.table_invites
for each row execute function public.touch_updated_at();

create trigger join_codes_touch_updated_at
before update on public.table_join_codes
for each row execute function public.touch_updated_at();

create trigger characters_touch_updated_at
before update on public.characters
for each row execute function public.touch_updated_at();

create trigger character_resources_touch_updated_at
before update on public.character_resources
for each row execute function public.touch_updated_at();

create trigger character_attributes_touch_updated_at
before update on public.character_attributes
for each row execute function public.touch_updated_at();

create trigger weapons_touch_updated_at
before update on public.character_weapons
for each row execute function public.touch_updated_at();

create trigger techniques_touch_updated_at
before update on public.character_techniques
for each row execute function public.touch_updated_at();

create trigger passives_touch_updated_at
before update on public.character_passives
for each row execute function public.touch_updated_at();

create trigger vows_touch_updated_at
before update on public.character_vows
for each row execute function public.touch_updated_at();

create trigger inventory_touch_updated_at
before update on public.character_inventory_items
for each row execute function public.touch_updated_at();

create trigger conditions_touch_updated_at
before update on public.character_conditions
for each row execute function public.touch_updated_at();

create trigger order_entries_touch_updated_at
before update on public.order_entries
for each row execute function public.touch_updated_at();

create policy "Profiles are visible to the owner and table peers"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.table_memberships me
    join public.table_memberships peer
      on peer.table_id = me.table_id
    where me.user_id = auth.uid()
      and me.active = true
      and peer.active = true
      and peer.user_id = profiles.id
  )
);

create policy "Profiles can be updated by the owner"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Profiles can be inserted by the owner"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Tables are visible to members"
on public.tables
for select
to authenticated
using (public.is_table_member(id) or owner_id = auth.uid());

create policy "Tables can be created by authenticated users"
on public.tables
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Tables can be updated by the owner or gm"
on public.tables
for update
to authenticated
using (owner_id = auth.uid() or public.is_table_gm(id))
with check (owner_id = auth.uid() or public.is_table_gm(id));

create policy "Tables can be deleted by the owner"
on public.tables
for delete
to authenticated
using (owner_id = auth.uid());

create policy "Memberships are visible to table peers"
on public.table_memberships
for select
to authenticated
using (user_id = auth.uid() or public.is_table_member(table_id));

create policy "Memberships can be managed by the table owner or gm"
on public.table_memberships
for all
to authenticated
using (public.can_manage_table(table_id))
with check (public.can_manage_table(table_id));

create policy "Invites are visible to table managers"
on public.table_invites
for select
to authenticated
using (public.can_manage_table(table_id));

create policy "Invites can be created by table managers"
on public.table_invites
for insert
to authenticated
with check (public.can_manage_table(table_id));

create policy "Invites can be updated by table managers"
on public.table_invites
for update
to authenticated
using (public.can_manage_table(table_id))
with check (public.can_manage_table(table_id));

create policy "Invites can be deleted by table managers"
on public.table_invites
for delete
to authenticated
using (public.can_manage_table(table_id));

create policy "Join codes are visible to table managers"
on public.table_join_codes
for select
to authenticated
using (public.can_manage_table(table_id));

create policy "Join codes can be created by table managers"
on public.table_join_codes
for insert
to authenticated
with check (public.can_manage_table(table_id));

create policy "Join codes can be updated by table managers"
on public.table_join_codes
for update
to authenticated
using (public.can_manage_table(table_id))
with check (public.can_manage_table(table_id));

create policy "Join codes can be deleted by table managers"
on public.table_join_codes
for delete
to authenticated
using (public.can_manage_table(table_id));

create policy "Characters are visible to table members"
on public.characters
for select
to authenticated
using (public.is_table_member(table_id));

create policy "Characters can be created by players or managers"
on public.characters
for insert
to authenticated
with check (owner_id = auth.uid() and public.can_play_table(table_id));

create policy "Characters can be updated by the owner or managers"
on public.characters
for update
to authenticated
using (owner_id = auth.uid() or public.can_manage_table(table_id))
with check (owner_id = auth.uid() or public.can_manage_table(table_id));

create policy "Characters can be deleted by the owner or managers"
on public.characters
for delete
to authenticated
using (owner_id = auth.uid() or public.can_manage_table(table_id));

create policy "Character resources are visible to table members"
on public.character_resources
for select
to authenticated
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character resources can be managed by owners or managers"
on public.character_resources
for all
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
);

create policy "Character attributes are visible to table members"
on public.character_attributes
for select
to authenticated
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character attributes can be managed by owners or managers"
on public.character_attributes
for all
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
);

create policy "Character weapons are visible to table members"
on public.character_weapons
for select
to authenticated
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character weapons can be managed by owners or managers"
on public.character_weapons
for all
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
);

create policy "Character techniques are visible to table members"
on public.character_techniques
for select
to authenticated
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character techniques can be managed by owners or managers"
on public.character_techniques
for all
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
);

create policy "Character passives are visible to table members"
on public.character_passives
for select
to authenticated
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character passives can be managed by owners or managers"
on public.character_passives
for all
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
);

create policy "Character vows are visible to table members"
on public.character_vows
for select
to authenticated
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character vows can be managed by owners or managers"
on public.character_vows
for all
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
);

create policy "Character inventory items are visible to table members"
on public.character_inventory_items
for select
to authenticated
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character inventory items can be managed by owners or managers"
on public.character_inventory_items
for all
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
);

create policy "Character conditions are visible to table members"
on public.character_conditions
for select
to authenticated
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character conditions can be managed by owners or managers"
on public.character_conditions
for all
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (c.owner_id = auth.uid() or public.can_manage_table(c.table_id))
  )
);

create policy "Order entries are visible to table members"
on public.order_entries
for select
to authenticated
using (public.is_table_member(table_id));

create policy "Order entries can be created by table players and managers"
on public.order_entries
for insert
to authenticated
with check (public.can_play_table(table_id));

create policy "Order entries can be updated by table players and managers"
on public.order_entries
for update
to authenticated
using (public.can_play_table(table_id))
with check (public.can_play_table(table_id));

create policy "Order entries can be deleted by table players and managers"
on public.order_entries
for delete
to authenticated
using (public.can_play_table(table_id));

create policy "Logs are visible to table members"
on public.table_logs
for select
to authenticated
using (public.is_table_member(table_id));

create policy "Logs can be created by table players and managers"
on public.table_logs
for insert
to authenticated
with check (public.can_play_table(table_id));

create policy "Logs can be updated by table managers"
on public.table_logs
for update
to authenticated
using (public.can_manage_table(table_id))
with check (public.can_manage_table(table_id));

create policy "Logs can be deleted by table managers"
on public.table_logs
for delete
to authenticated
using (public.can_manage_table(table_id));

create policy "Snapshots are visible to table members"
on public.table_snapshots
for select
to authenticated
using (public.is_table_member(table_id));

create policy "Snapshots can be created by table players and managers"
on public.table_snapshots
for insert
to authenticated
with check (public.can_play_table(table_id));

create policy "Snapshots can be updated by table managers"
on public.table_snapshots
for update
to authenticated
using (public.can_manage_table(table_id))
with check (public.can_manage_table(table_id));

create policy "Snapshots can be deleted by table managers"
on public.table_snapshots
for delete
to authenticated
using (public.can_manage_table(table_id));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.normalize_username(text) to anon, authenticated;
grant execute on function public.slugify_text(text) to anon, authenticated;
grant execute on function public.claim_table_invite(text) to authenticated;
grant execute on function public.claim_join_code(text) to authenticated;

commit;
