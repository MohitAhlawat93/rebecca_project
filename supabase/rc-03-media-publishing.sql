-- RC-03 — Media draft / preview / publish state
-- Run this in Rebecca's own Supabase project during handoff.
--
-- This schema intentionally does NOT contain the real RC_STORE_SECRET.
-- After creating the row, set the hash once from a trusted SQL session:
--
-- update public.rebecca_media_state
-- set secret_hash = encode(extensions.digest('<RC_STORE_SECRET>', 'sha256'), 'hex')
-- where id = 'current';

create table if not exists public.rebecca_media_state (
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

alter table public.rebecca_media_state enable row level security;

revoke all on table public.rebecca_media_state from anon, authenticated;

grant select (
  id, version, draft, published, published_version,
  history, updated_by, updated_at, published_at
) on public.rebecca_media_state to anon;

grant update (
  version, draft, published, published_version,
  history, updated_by, updated_at, published_at
) on public.rebecca_media_state to anon;

insert into public.rebecca_media_state (
  id, version, draft, published, published_version,
  history, updated_by, secret_hash
)
values (
  'current', 0, '{}'::jsonb, '{}'::jsonb, 0,
  '[]'::jsonb, 'RC-03 bootstrap', repeat('0', 64)
)
on conflict (id) do nothing;

drop policy if exists rc_media_read on public.rebecca_media_state;
create policy rc_media_read
on public.rebecca_media_state
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

drop policy if exists rc_media_update on public.rebecca_media_state;
create policy rc_media_update
on public.rebecca_media_state
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

create or replace view public.rebecca_media_api
with (security_invoker = true)
as
select
  id, version, draft, published, published_version,
  history, updated_by, updated_at, published_at
from public.rebecca_media_state;

revoke all on public.rebecca_media_api from anon, authenticated;
grant select on public.rebecca_media_api to anon;
grant update (
  version, draft, published, published_version,
  history, updated_by, updated_at, published_at
) on public.rebecca_media_api to anon;

notify pgrst, 'reload schema';
