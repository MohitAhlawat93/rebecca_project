-- RC-05 — Visual Website Editor draft layer
-- Adds a private server-side visual draft beside the published Quick Control payload.
-- The existing RLS + x-rc-control-secret policy continues to protect the row.

alter table public.rebecca_control_state
  add column if not exists visual_draft jsonb not null default '{}'::jsonb;

grant select (visual_draft) on public.rebecca_control_state to anon;
grant update (visual_draft) on public.rebecca_control_state to anon;

-- Preserve the existing view column order; append visual_draft at the end.
create or replace view public.rebecca_control_api
with (security_invoker = true)
as
select
  id,
  version,
  payload,
  updated_by,
  updated_at,
  visual_draft
from public.rebecca_control_state;

revoke all on public.rebecca_control_api from anon, authenticated;

grant select (
  id, version, payload, updated_by, updated_at, visual_draft
) on public.rebecca_control_api to anon;

grant update (
  version, payload, updated_by, updated_at, visual_draft
) on public.rebecca_control_api to anon;

notify pgrst, 'reload schema';
