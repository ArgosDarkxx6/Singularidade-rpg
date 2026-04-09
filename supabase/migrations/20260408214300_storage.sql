begin;

grant usage on schema storage to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

do $$
begin
  begin
    alter table storage.objects enable row level security;
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    drop policy if exists "Avatar objects are visible to authenticated users" on storage.objects;
    create policy "Avatar objects are visible to authenticated users"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'avatars');
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    drop policy if exists "Avatar objects can be uploaded by authenticated users" on storage.objects;
    create policy "Avatar objects can be uploaded by authenticated users"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'avatars' and owner = auth.uid());
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    drop policy if exists "Avatar objects can be updated by owners" on storage.objects;
    create policy "Avatar objects can be updated by owners"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'avatars' and owner = auth.uid())
    with check (bucket_id = 'avatars' and owner = auth.uid());
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    drop policy if exists "Avatar objects can be deleted by owners" on storage.objects;
    create policy "Avatar objects can be deleted by owners"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'avatars' and owner = auth.uid());
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;

commit;
