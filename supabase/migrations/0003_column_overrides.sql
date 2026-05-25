-- ============================================================
-- Migration 0003: column_overrides on datasets
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Adds a JSONB column that stores per-column user overrides keyed
-- by the original column name. Shape:
--   {
--     "order_id":   { "display_name": "Order #", "role": "dimension" },
--     "amount":     { "type": "number", "role": "measure", "null_strategy": "replace_zero" }
--   }
--
-- All four override fields are optional — users may set any combination.
-- Existing rows get an empty object via the default.

alter table public.datasets
  add column column_overrides jsonb not null default '{}'::jsonb;

comment on column public.datasets.column_overrides is
  'Per-column user overrides keyed by original column name. Each value is a partial { display_name, type, role, null_strategy } object.';

-- No new RLS policies needed — column_overrides inherits the existing
-- per-row datasets policies (users can only update their own datasets).
