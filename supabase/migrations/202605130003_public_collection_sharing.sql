alter table public.collections
  add column if not exists is_public boolean not null default false,
  add column if not exists public_token uuid unique;

create index if not exists collections_public_token_idx
  on public.collections (public_token)
  where is_public = true;

drop policy if exists "Anyone can read public shared collections" on public.collections;
create policy "Anyone can read public shared collections"
  on public.collections
  for select
  using (is_public = true and public_token is not null);

drop policy if exists "Anyone can read compares in public collections" on public.compares;
create policy "Anyone can read compares in public collections"
  on public.compares
  for select
  using (
    exists (
      select 1
      from public.collections
      where collections.id = compares.collection_id
        and collections.is_public = true
        and collections.public_token is not null
    )
  );

drop policy if exists "Anyone can read versions in public collections" on public.compare_versions;
create policy "Anyone can read versions in public collections"
  on public.compare_versions
  for select
  using (
    exists (
      select 1
      from public.compares
      join public.collections on collections.id = compares.collection_id
      where compares.id = compare_versions.compare_id
        and collections.is_public = true
        and collections.public_token is not null
    )
  );

drop policy if exists "Anyone can read public collection JSON version files" on storage.objects;
create policy "Anyone can read public collection JSON version files"
  on storage.objects
  for select
  using (
    bucket_id = 'json-version-files'
    and exists (
      select 1
      from public.compare_versions
      join public.compares on compares.id = compare_versions.compare_id
      join public.collections on collections.id = compares.collection_id
      where collections.is_public = true
        and collections.public_token is not null
        and (
          compare_versions.source_path = storage.objects.name
          or compare_versions.target_path = storage.objects.name
        )
    )
  );
