-- RC-05 — Visual Website Editor draft layer
-- Adds a private server-side visual draft beside the published Quick Control payload.
-- The existing RLS + x-rc-control-secret policy continues to protect the row.

alter table public.rebecca_control_state
  add column if not exists visual_draft jsonb not null default '{}'::jsonb;

grant select (visual_draft) on public.rebecca_control_state to anon;
grant update (visual_draft) on public.rebecca_control_state to anon;

create or replace view public.rebecca_control_api
with (security_invoker = true)
as
select
  id,
  version,
  payload,
  visual_draft,
  updated_by,
  updated_at
from public.rebecca_control_state;

revoke all on public.rebecca_control_api from anon, authenticated;

grant select (
  id, version, payload, visual_draft, updated_by, updated_at
) on public.rebecca_control_api to anon;

grant update (
  version, payload, visual_draft, updated_by, updated_at
) on public.rebecca_control_api to anon;

notify pgrst, 'reload schema';
