-- SEARCH-08 — Automated Search Data Sync & Persistence
-- Applied to the Rebecca Supabase project on 2026-10-07.
-- Additive only. Search data is isolated from Rebecca Control content tables.
-- Public-schema tables use RLS plus an x-search-store-secret header check.

create table if not exists public.search_provider_connections (
  client_id text not null,
  provider text not null check (provider in ('google','bing')),
  status text not null default 'needs_connection'
    check (status in ('needs_connection','connected','refresh_required','error','revoked')),
  site_url text,
  account_label text,
  scopes text[] not null default '{}',
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz,
  connected_at timestamptz,
  last_validated_at timestamptz,
  last_error_code text,
  last_error_message text,
  secret_hash text not null,
  updated_at timestamptz not null default now(),
  primary key (client_id, provider)
);

create table if not exists public.search_metric_rows (
  client_id text not null,
  row_key text not null,
  source text not null,
  surface text not null,
  metric_date date,
  query text not null default '',
  page text not null default '',
  country text not null default '',
  device text not null default '',
  topic text not null default '',
  intent text not null default '',
  clicks bigint not null default 0 check (clicks >= 0),
  impressions bigint not null default 0 check (impressions >= 0),
  ctr double precision not null default 0 check (ctr >= 0),
  position double precision,
  citations bigint not null default 0 check (citations >= 0),
  cited_pages bigint not null default 0 check (cited_pages >= 0),
  observed_window_start date,
  observed_window_end date,
  synced_at timestamptz not null default now(),
  secret_hash text not null,
  primary key (client_id, row_key)
);

create table if not exists public.search_sync_runs (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  provider text not null,
  surface text not null default 'all',
  trigger text not null default 'manual'
    check (trigger in ('manual','cron','oauth','import','backfill','test')),
  status text not null default 'running'
    check (status in ('running','success','partial','error','skipped')),
  idempotency_key text not null,
  window_start date,
  window_end date,
  rows_written integer not null default 0 check (rows_written >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_code text,
  error_message text,
  secret_hash text not null,
  created_at timestamptz not null default now(),
  unique (client_id, idempotency_key)
);

create table if not exists public.search_sync_state (
  client_id text not null,
  provider text not null,
  surface text not null default 'all',
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_window_start date,
  last_window_end date,
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  last_error_code text,
  last_error_message text,
  secret_hash text not null,
  updated_at timestamptz not null default now(),
  primary key (client_id, provider, surface)
);

create index if not exists search_metric_rows_client_date_idx
  on public.search_metric_rows (client_id, metric_date desc);
create index if not exists search_metric_rows_client_source_surface_idx
  on public.search_metric_rows (client_id, source, surface, metric_date desc);
create index if not exists search_metric_rows_client_page_idx
  on public.search_metric_rows (client_id, page);
create index if not exists search_metric_rows_client_query_idx
  on public.search_metric_rows (client_id, query);
create index if not exists search_sync_runs_client_started_idx
  on public.search_sync_runs (client_id, started_at desc);

alter table public.search_provider_connections enable row level security;
alter table public.search_metric_rows enable row level security;
alter table public.search_sync_runs enable row level security;
alter table public.search_sync_state enable row level security;

revoke all on table public.search_provider_connections from anon, authenticated;
revoke all on table public.search_metric_rows from anon, authenticated;
revoke all on table public.search_sync_runs from anon, authenticated;
revoke all on table public.search_sync_state from anon, authenticated;

grant select, insert, update on table public.search_provider_connections to anon;
grant select, insert, update on table public.search_metric_rows to anon;
grant select, insert, update on table public.search_sync_runs to anon;
grant select, insert, update on table public.search_sync_state to anon;

drop policy if exists search_provider_connections_read on public.search_provider_connections;
create policy search_provider_connections_read on public.search_provider_connections
for select to anon using (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
drop policy if exists search_provider_connections_insert on public.search_provider_connections;
create policy search_provider_connections_insert on public.search_provider_connections
for insert to anon with check (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
drop policy if exists search_provider_connections_update on public.search_provider_connections;
create policy search_provider_connections_update on public.search_provider_connections
for update to anon using (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
) with check (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);

drop policy if exists search_metric_rows_read on public.search_metric_rows;
create policy search_metric_rows_read on public.search_metric_rows
for select to anon using (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
drop policy if exists search_metric_rows_insert on public.search_metric_rows;
create policy search_metric_rows_insert on public.search_metric_rows
for insert to anon with check (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
drop policy if exists search_metric_rows_update on public.search_metric_rows;
create policy search_metric_rows_update on public.search_metric_rows
for update to anon using (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
) with check (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);

drop policy if exists search_sync_runs_read on public.search_sync_runs;
create policy search_sync_runs_read on public.search_sync_runs
for select to anon using (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
drop policy if exists search_sync_runs_insert on public.search_sync_runs;
create policy search_sync_runs_insert on public.search_sync_runs
for insert to anon with check (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
drop policy if exists search_sync_runs_update on public.search_sync_runs;
create policy search_sync_runs_update on public.search_sync_runs
for update to anon using (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
) with check (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);

drop policy if exists search_sync_state_read on public.search_sync_state;
create policy search_sync_state_read on public.search_sync_state
for select to anon using (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
drop policy if exists search_sync_state_insert on public.search_sync_state;
create policy search_sync_state_insert on public.search_sync_state
for insert to anon with check (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
drop policy if exists search_sync_state_update on public.search_sync_state;
create policy search_sync_state_update on public.search_sync_state
for update to anon using (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
) with check (
  encode(digest(coalesce((current_setting('request.headers', true)::jsonb ->> 'x-search-store-secret'), ''), 'sha256'), 'hex') = secret_hash
);
