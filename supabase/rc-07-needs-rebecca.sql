-- RC-07 — Needs Rebecca
-- Privacy-minimizing unresolved-question inbox.
-- Stores grouped/sanitized public questions only. No visitor identity, IP,
-- user-agent, cookies, raw chat history or screening documents are stored.

create table if not exists public.rebecca_needs_state (
  id text primary key,
  version bigint not null default 0 check (version >= 0),
  items jsonb not null default '[]'::jsonb,
  updated_by text not null default 'Rebecca Concierge',
  updated_at timestamptz not null default now(),
  secret_hash text not null
);

alter table public.rebecca_needs_state enable row level security;

revoke all on table public.rebecca_needs_state from anon, authenticated;

grant select (id, version, items, updated_by, updated_at)
  on public.rebecca_needs_state to anon;

grant update (version, items, updated_by, updated_at)
  on public.rebecca_needs_state to anon;

insert into public.rebecca_needs_state (
  id, version, items, updated_by, secret_hash
)
select
  'current',
  0,
  '[]'::jsonb,
  'RC-07 bootstrap',
  coalesce(
    (select secret_hash from public.rebecca_control_state where id = 'current'),
    repeat('0', 64)
  )
where not exists (
  select 1 from public.rebecca_needs_state where id = 'current'
);

drop policy if exists rc_needs_read on public.rebecca_needs_state;
create policy rc_needs_read
on public.rebecca_needs_state
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

drop policy if exists rc_needs_update on public.rebecca_needs_state;
create policy rc_needs_update
on public.rebecca_needs_state
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

create or replace view public.rebecca_needs_api
with (security_invoker = true)
as
select id, version, items, updated_by, updated_at
from public.rebecca_needs_state;

revoke all on public.rebecca_needs_api from anon, authenticated;
grant select on public.rebecca_needs_api to anon;
grant update (version, items, updated_by, updated_at)
  on public.rebecca_needs_api to anon;

notify pgrst, 'reload schema';
