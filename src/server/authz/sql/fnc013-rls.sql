-- FNC-013 RLS contract
-- FORBIDDEN for non-owner access.

alter table profiles enable row level security;

create policy profiles_self_select
  on profiles
  for select
  using (auth.uid() = user_id);

create policy profiles_self_update
  on profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
