create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null
    or (
      username = lower(username)
      and username ~ '^[a-z0-9_]{3,30}$'
    )
  )
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles enable row level security;

create policy "Users can read their profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "Users can create their profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their profile"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

insert into public.profiles (user_id, display_name)
select
  id,
  coalesce(
    raw_user_meta_data ->> 'display_name',
    raw_user_meta_data ->> 'full_name',
    raw_user_meta_data ->> 'name'
  )
from auth.users
on conflict (user_id) do nothing;
