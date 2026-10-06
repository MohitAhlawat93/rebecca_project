-- RC-02B — Rebecca Control least-privilege content store
-- Preferred production design:
--   Vercel uses a Supabase publishable key plus a separate high-entropy
--   RC_STORE_SECRET. No service_role / sb_secret_* key is required by the app.
--
-- After running this schema in a NEW Rebecca Supabase project, set the secret
-- hash once from a trusted SQL session:
--
-- update public.rebecca_control_state
-- set secret_hash = encode(extensions.digest('<RC_STORE_SECRET>', 'sha256'), 'hex')
-- where id = 'current';
--
-- Never commit the real RC_STORE_SECRET.

create table if not exists public.rebecca_control_state (
  id text primary key,
  version bigint not null default 0 check (version >= 0),
  payload jsonb not null default '{}'::jsonb,
  updated_by text not null default 'Rebecca',
  updated_at timestamptz not null default now(),
  secret_hash text not null
);

alter table public.rebecca_control_state enable row level security;

revoke all on table public.rebecca_control_state from anon, authenticated;

grant select (id, version, payload, updated_by, updated_at)
  on public.rebecca_control_state to anon;

grant update (version, payload, updated_by, updated_at)
  on public.rebecca_control_state to anon;

insert into public.rebecca_control_state (
  id, version, payload, updated_by, secret_hash
)
values (
  'current',
  0,
  '{}'::jsonb,
  'RC-02B bootstrap',
  repeat('0', 64)
)
on conflict (id) do nothing;

drop policy if exists rc_control_read on public.rebecca_control_state;
create policy rc_control_read
on public.rebecca_control_state
for select
to anon
using (
  id = 'current'
  and encode(
    extensions.digest(
      coalesce(current_setting('request.headers', true)::jsonb ->> 'x-rc-control-secret', ''),
      'sha256'
    ),
    'hex'
  ) = secret_hash
);

drop policy if exists rc_control_update on public.rebecca_control_state;
create policy rc_control_update
on public.rebecca_control_state
for update
to anon
using (
  id = 'current'
  and encode(
    extensions.digest(
      coalesce(current_setting('request.headers', true)::jsonb ->> 'x-rc-control-secret', ''),
      'sha256'
    ),
    'hex'
  ) = secret_hash
)
with check (
  id = 'current'
  and encode(
    extensions.digest(
      coalesce(current_setting('request.headers', true)::jsonb ->> 'x-rc-control-secret', ''),
      'sha256'
    ),
    'hex'
  ) = secret_hash
);

notify pgrst, 'reload schema';
