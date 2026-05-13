create or replace function public.collection_has_public_shared_compare(
  target_collection_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.compares
    where collection_id = target_collection_id
      and is_public = true
      and public_token is not null
  );
$$;

create or replace function public.is_public_shared_collection(
  target_collection_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collections
    where id = target_collection_id
      and is_public = true
      and public_token is not null
  );
$$;

create or replace function public.is_public_shared_compare(
  target_compare_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.compares
    where id = target_compare_id
      and is_public = true
      and public_token is not null
  );
$$;

create or replace function public.is_compare_in_public_shared_collection(
  target_compare_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.compares
    join public.collections on collections.id = compares.collection_id
    where compares.id = target_compare_id
      and collections.is_public = true
      and collections.public_token is not null
  );
$$;

drop policy if exists "Anyone can read collections for public shared compares" on public.collections;
create policy "Anyone can read collections for public shared compares"
  on public.collections
  for select
  using (public.collection_has_public_shared_compare(id));

drop policy if exists "Anyone can read compares in public collections" on public.compares;
create policy "Anyone can read compares in public collections"
  on public.compares
  for select
  using (public.is_public_shared_collection(collection_id));

drop policy if exists "Anyone can read public shared compare versions" on public.compare_versions;
create policy "Anyone can read public shared compare versions"
  on public.compare_versions
  for select
  using (public.is_public_shared_compare(compare_id));

drop policy if exists "Anyone can read versions in public collections" on public.compare_versions;
create policy "Anyone can read versions in public collections"
  on public.compare_versions
  for select
  using (public.is_compare_in_public_shared_collection(compare_id));

drop policy if exists "Anyone can read public shared JSON version files" on storage.objects;
create policy "Anyone can read public shared JSON version files"
  on storage.objects
  for select
  using (
    bucket_id = 'json-version-files'
    and exists (
      select 1
      from public.compare_versions
      where public.is_public_shared_compare(compare_versions.compare_id)
        and (
          compare_versions.source_path = storage.objects.name
          or compare_versions.target_path = storage.objects.name
        )
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
      where public.is_compare_in_public_shared_collection(compare_versions.compare_id)
        and (
          compare_versions.source_path = storage.objects.name
          or compare_versions.target_path = storage.objects.name
        )
    )
  );
