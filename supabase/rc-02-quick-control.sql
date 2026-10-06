-- RC-02 — Rebecca Control quick-content store
-- Run this only in Rebecca's own isolated Supabase project.

create table if not exists public.rebecca_control_state (
  id text primary key,
  version bigint not null default 0 check (version >= 0),
  payload jsonb not null default '{}'::jsonb,
  updated_by text not null default 'Rebecca',
  updated_at timestamptz not null default now()
);

alter table public.rebecca_control_state enable row level security;

-- No browser/client role needs direct access. Rebecca Control reads/writes only
-- through its authenticated Vercel server functions using a server secret.
revoke all on table public.rebecca_control_state from anon;
revoke all on table public.rebecca_control_state from authenticated;
grant select, insert, update on table public.rebecca_control_state to service_role;

insert into public.rebecca_control_state (id, version, payload, updated_by)
values ('current', 0, '{}'::jsonb, 'RC-02 bootstrap')
on conflict (id) do nothing;
