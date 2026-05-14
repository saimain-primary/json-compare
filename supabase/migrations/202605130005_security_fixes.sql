-- Security fix: explicit UPDATE policy for compare_versions
-- Previously only SELECT/INSERT/DELETE were defined, leaving UPDATE intent ambiguous.
create policy "Users can update their compare versions"
  on public.compare_versions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Security fix: explicit UPDATE policies for is_public / public_token on compares and collections
-- The client now issues revoke updates (.update is_public=false, public_token=null).
-- Ensure these are covered beyond the existing ownership policies.
drop policy if exists "Users can update their compares" on public.compares;
create policy "Users can update their compares"
  on public.compares
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their collections" on public.collections;
create policy "Users can update their collections"
  on public.collections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
