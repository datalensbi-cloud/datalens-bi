-- ============================================================
-- Migration 0006: dashboards table
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Each dashboard is a saved layout that embeds N existing charts.
-- Layout JSONB stores react-grid-layout shape:
--   [{ chart_id, x, y, w, h }, ...]
-- Charts that get deleted leave stale references — we filter at render.

create table public.dashboards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  layout      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.dashboards is 'Saved multi-chart layouts. Embeds charts by id; layout JSONB holds grid positions.';
comment on column public.dashboards.layout is 'react-grid-layout array: [{ chart_id, x, y, w, h }, ...].';

create index dashboards_user_recent_idx on public.dashboards (user_id, created_at desc);

alter table public.dashboards enable row level security;

create policy "Users can view own dashboards"
  on public.dashboards for select using (auth.uid() = user_id);
create policy "Users can insert own dashboards"
  on public.dashboards for insert with check (auth.uid() = user_id);
create policy "Users can update own dashboards"
  on public.dashboards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own dashboards"
  on public.dashboards for delete using (auth.uid() = user_id);

create trigger on_dashboards_updated
  before update on public.dashboards
  for each row execute function public.handle_updated_at();
