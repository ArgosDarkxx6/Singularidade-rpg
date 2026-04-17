begin;

create or replace function public.is_username_available(input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.normalize_username(input) is not null
    and length(public.normalize_username(input)) between 3 and 24
    and public.normalize_username(input) ~ '^[a-z0-9_]+$'
    and not exists (
      select 1
      from public.profiles
      where username = public.normalize_username(input)::citext
    );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

commit;
