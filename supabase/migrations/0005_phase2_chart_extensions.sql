-- ============================================================
-- Migration 0005: Phase 2 chart extensions
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Extends the `charts` table to support pivot tables and KPI cards.
-- The `config` JSONB grows to hold:
--   - aggregation: SUM | AVG | COUNT | COUNT_DISTINCT | MIN | MAX
--   - filters: [{ column, op, value }]
--   - For pivots: rows[], columns[], values[]
--   - For KPI cards (Sprint 2): metric, comparison
--
-- No new tables — Phase 2 is schema-light by design.

alter table public.charts
  drop constraint if exists charts_chart_type_check;

alter table public.charts
  add constraint charts_chart_type_check
  check (chart_type in ('bar', 'line', 'pie', 'scatter', 'pivot', 'kpi'));

comment on column public.charts.chart_type is
  'Chart kind. Phase 1: bar, line, pie, scatter. Phase 2: pivot, kpi.';
