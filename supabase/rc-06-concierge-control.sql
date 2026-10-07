-- RC-06 — Concierge Control
-- Private owner-managed concierge configuration with Draft → Test → Publish.
-- The app uses the existing Supabase publishable key + RC_STORE_SECRET model.
-- No service-role key is required.

create table if not exists public.rebecca_concierge_state (
  id text primary key,
  version bigint not null default 0 check (version >= 0),
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  published_version bigint not null default 0 check (published_version >= 0),
  history jsonb not null default '[]'::jsonb,
  updated_by text not null default 'Rebecca',
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  secret_hash text not null
);

alter table public.rebecca_concierge_state enable row level security;

revoke all on table public.rebecca_concierge_state from anon, authenticated;

grant select (
  id, version, draft, published, published_version, history,
  updated_by, updated_at, published_at
) on public.rebecca_concierge_state to anon;

grant update (
  version, draft, published, published_version, history,
  updated_by, updated_at, published_at
) on public.rebecca_concierge_state to anon;

insert into public.rebecca_concierge_state (
  id, version, draft, published, published_version, history,
  updated_by, secret_hash
)
select
  'current',
  0,
  '{}'::jsonb,
  '{}'::jsonb,
  0,
  '[]'::jsonb,
  'RC-06 bootstrap',
  coalesce(
    (select secret_hash from public.rebecca_control_state where id = 'current'),
    repeat('0', 64)
  )
where not exists (
  select 1 from public.rebecca_concierge_state where id = 'current'
);

drop policy if exists rc_concierge_read on public.rebecca_concierge_state;
create policy rc_concierge_read
on public.rebecca_concierge_state
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

drop policy if exists rc_concierge_update on public.rebecca_concierge_state;
create policy rc_concierge_update
on public.rebecca_concierge_state
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

create or replace view public.rebecca_concierge_api
with (security_invoker = true)
as
select
  id,
  version,
  draft,
  published,
  published_version,
  history,
  updated_by,
  updated_at,
  published_at
from public.rebecca_concierge_state;

revoke all on public.rebecca_concierge_api from anon, authenticated;

grant select on public.rebecca_concierge_api to anon;

grant update (
  version, draft, published, published_version, history,
  updated_by, updated_at, published_at
) on public.rebecca_concierge_api to anon;

notify pgrst, 'reload schema';
