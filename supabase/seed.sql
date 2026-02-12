-- Seed data for local development and integration tests.
-- This file is executed by `supabase seed --local`.

begin;

-- Re-seed policy_settings deterministically.
delete from public.policy_settings
where policy_type='terms'
   or policy_type='privacy';

insert into public.policy_settings (
  policy_type,
  current_version,
  effective_from,
  document_url,
  updated_by,
  updated_at,
  created_at
)
values
  (
    'terms',
    'v1.0',
    now(),
    'https://example.com/policies/terms/v1.0',
    null,
    now(),
    now()
  ),
  (
    'privacy',
    'v1.0',
    now(),
    'https://example.com/policies/privacy/v1.0',
    null,
    now(),
    now()
  );

commit;
