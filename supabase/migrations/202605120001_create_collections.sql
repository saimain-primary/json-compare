create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collections_user_id_created_at_idx
  on public.collections (user_id, created_at desc);

alter table public.collections enable row level security;

create policy "Users can read their collections"
  on public.collections
  for select
  using (auth.uid() = user_id);

create policy "Users can create their collections"
  on public.collections
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their collections"
  on public.collections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their collections"
  on public.collections
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_collections_updated_at on public.collections;

create trigger set_collections_updated_at
  before update on public.collections
  for each row
  execute function public.set_updated_at();
