-- ============================================================
-- Migration 0004: charts table
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Each saved chart belongs to a user and references one dataset.
-- Config JSONB holds all chart-specific knobs:
--   { x: "order_date", y: "amount", title: "Revenue", xAxisLabel?, yAxisLabel? }
-- Future days extend config with: groupBy, filters, multiple y columns,
-- color palette, aggregation, etc. — without schema migrations.

create table public.charts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  dataset_id  uuid not null references public.datasets(id) on delete cascade,
  name        text not null,
  chart_type  text not null check (chart_type in ('bar', 'line', 'pie', 'scatter')),
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.charts is 'Saved chart configurations. Renders by combining config with the parsed dataset JSON at view time.';
comment on column public.charts.config is 'JSONB: { x, y, title, xAxisLabel, yAxisLabel, ... }. Schema-less so we can add knobs without migrations.';

create index charts_user_recent_idx on public.charts (user_id, created_at desc);
create index charts_dataset_idx on public.charts (dataset_id);

-- RLS — users can only CRUD their own charts
alter table public.charts enable row level security;

create policy "Users can view own charts"
  on public.charts for select using (auth.uid() = user_id);
create policy "Users can insert own charts"
  on public.charts for insert with check (auth.uid() = user_id);
create policy "Users can update own charts"
  on public.charts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own charts"
  on public.charts for delete using (auth.uid() = user_id);

-- updated_at trigger (reuse function from migration 0001)
create trigger on_charts_updated
  before update on public.charts
  for each row execute function public.handle_updated_at();
