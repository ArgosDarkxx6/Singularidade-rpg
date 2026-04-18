begin;

alter table public.characters
  add column if not exists lore text not null default '';

create table if not exists public.character_gallery_images (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  image_url text not null default '',
  image_path text not null default '',
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_character_gallery_images_character_id on public.character_gallery_images(character_id);

create trigger character_gallery_images_touch_updated_at
before update on public.character_gallery_images
for each row execute procedure public.set_updated_at();

create policy "Character gallery images are visible to table members"
on public.character_gallery_images
for select
using (public.is_table_member((select table_id from public.characters where id = character_id)));

create policy "Character gallery images can be managed by owners or managers"
on public.character_gallery_images
for all
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (
        public.can_manage_table(c.table_id)
        or c.owner_id = auth.uid()
      )
  )
)
with check (
  exists (
    select 1
    from public.characters c
    where c.id = character_id
      and (
        public.can_manage_table(c.table_id)
        or c.owner_id = auth.uid()
      )
  )
);

commit;
