alter table public.compares
  add column if not exists is_public boolean not null default false,
  add column if not exists public_token uuid unique;

create index if not exists compares_public_token_idx
  on public.compares (public_token)
  where is_public = true;

drop policy if exists "Anyone can read public shared compares" on public.compares;
create policy "Anyone can read public shared compares"
  on public.compares
  for select
  using (is_public = true and public_token is not null);

drop policy if exists "Anyone can read public shared compare versions" on public.compare_versions;
create policy "Anyone can read public shared compare versions"
  on public.compare_versions
  for select
  using (
    exists (
      select 1
      from public.compares
      where compares.id = compare_versions.compare_id
        and compares.is_public = true
        and compares.public_token is not null
    )
  );

drop policy if exists "Anyone can read collections for public shared compares" on public.collections;
create policy "Anyone can read collections for public shared compares"
  on public.collections
  for select
  using (
    exists (
      select 1
      from public.compares
      where compares.collection_id = collections.id
        and compares.is_public = true
        and compares.public_token is not null
    )
  );

drop policy if exists "Anyone can read public shared JSON version files" on storage.objects;
create policy "Anyone can read public shared JSON version files"
  on storage.objects
  for select
  using (
    bucket_id = 'json-version-files'
    and exists (
      select 1
      from public.compare_versions
      join public.compares on compares.id = compare_versions.compare_id
      where compares.is_public = true
        and compares.public_token is not null
        and (
          compare_versions.source_path = storage.objects.name
          or compare_versions.target_path = storage.objects.name
        )
    )
  );
