-- RC-09 — History, Export & Recovery
-- Private owner-only system ledger and rolling recovery snapshots.
-- Uses the same publishable-key + RC_STORE_SECRET RLS model.

create table if not exists public.rebecca_system_state (
  id text primary key,
  version bigint not null default 0 check (version >= 0),
  events jsonb not null default '[]'::jsonb,
  snapshots jsonb not null default '[]'::jsonb,
  updated_by text not null default 'Rebecca Control',
  updated_at timestamptz not null default now(),
  secret_hash text not null
);

alter table public.rebecca_system_state enable row level security;

revoke all on table public.rebecca_system_state from anon, authenticated;

grant select (id, version, events, snapshots, updated_by, updated_at)
  on public.rebecca_system_state to anon;

grant update (version, events, snapshots, updated_by, updated_at)
  on public.rebecca_system_state to anon;

insert into public.rebecca_system_state (
  id, version, events, snapshots, updated_by, secret_hash
)
select
  'current',
  0,
  '[]'::jsonb,
  '[]'::jsonb,
  'RC-09 bootstrap',
  coalesce(
    (select secret_hash from public.rebecca_control_state where id = 'current'),
    repeat('0', 64)
  )
where not exists (
  select 1 from public.rebecca_system_state where id = 'current'
);

drop policy if exists rc_system_read on public.rebecca_system_state;
create policy rc_system_read
on public.rebecca_system_state
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

drop policy if exists rc_system_update on public.rebecca_system_state;
create policy rc_system_update
on public.rebecca_system_state
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

create or replace view public.rebecca_system_api
with (security_invoker = true)
as
select id, version, events, snapshots, updated_by, updated_at
from public.rebecca_system_state;

revoke all on public.rebecca_system_api from anon, authenticated;
grant select on public.rebecca_system_api to anon;
grant update (version, events, snapshots, updated_by, updated_at)
  on public.rebecca_system_api to anon;

notify pgrst, 'reload schema';
