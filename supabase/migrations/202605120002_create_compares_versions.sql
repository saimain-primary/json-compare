create table if not exists public.compares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compares_collection_id_created_at_idx
  on public.compares (collection_id, created_at desc);

alter table public.compares enable row level security;

create policy "Users can read their compares"
  on public.compares
  for select
  using (auth.uid() = user_id);

create policy "Users can create their compares"
  on public.compares
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their compares"
  on public.compares
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their compares"
  on public.compares
  for delete
  using (auth.uid() = user_id);

drop trigger if exists set_compares_updated_at on public.compares;

create trigger set_compares_updated_at
  before update on public.compares
  for each row
  execute function public.set_updated_at();

create table if not exists public.compare_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  compare_id uuid not null references public.compares(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  source_path text not null,
  target_path text not null,
  source_size bigint not null default 0,
  target_size bigint not null default 0,
  diff_count integer not null default 0,
  compare_options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists compare_versions_compare_id_created_at_idx
  on public.compare_versions (compare_id, created_at desc);

alter table public.compare_versions enable row level security;

create policy "Users can read their compare versions"
  on public.compare_versions
  for select
  using (auth.uid() = user_id);

create policy "Users can create their compare versions"
  on public.compare_versions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their compare versions"
  on public.compare_versions
  for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('json-version-files', 'json-version-files', false)
on conflict (id) do nothing;

create policy "Users can read their JSON version files"
  on storage.objects
  for select
  using (
    bucket_id = 'json-version-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can create their JSON version files"
  on storage.objects
  for insert
  with check (
    bucket_id = 'json-version-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their JSON version files"
  on storage.objects
  for update
  using (
    bucket_id = 'json-version-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'json-version-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their JSON version files"
  on storage.objects
  for delete
  using (
    bucket_id = 'json-version-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
