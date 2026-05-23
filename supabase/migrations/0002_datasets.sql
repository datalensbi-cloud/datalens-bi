-- ============================================================
-- Migration 0002: datasets table + storage bucket + RLS
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. datasets table
create table public.datasets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  original_filename text not null,
  file_path         text not null,
  parsed_path       text,
  row_count         integer,
  column_count      integer,
  file_size_bytes   bigint not null,
  mime_type         text not null,
  file_hash         text,
  status            text not null default 'uploaded'
    check (status in ('uploaded', 'parsed', 'parse_failed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.datasets is 'Uploaded CSV/XLSX files with parsed metadata. One row per file per user.';
comment on column public.datasets.file_path is 'Path inside the datasets storage bucket — format: {user_id}/{file_id}.{ext}';
comment on column public.datasets.parsed_path is 'Path inside storage of the parsed JSON blob — format: {user_id}/{file_id}.json';
comment on column public.datasets.file_hash is 'SHA-256 hex digest of the raw file bytes, used for per-user duplicate detection.';

create index datasets_user_recent_idx on public.datasets (user_id, created_at desc);
create index datasets_user_hash_idx on public.datasets (user_id, file_hash);

-- 2. RLS — users can only CRUD their own datasets
alter table public.datasets enable row level security;

create policy "Users can view own datasets"
  on public.datasets for select using (auth.uid() = user_id);
create policy "Users can insert own datasets"
  on public.datasets for insert with check (auth.uid() = user_id);
create policy "Users can update own datasets"
  on public.datasets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own datasets"
  on public.datasets for delete using (auth.uid() = user_id);

-- 3. updated_at trigger (reuse function from migration 0001)
create trigger on_datasets_updated
  before update on public.datasets
  for each row execute function public.handle_updated_at();

-- 4. Storage bucket — private, 25 MB cap, CSV/XLSX/JSON allowed
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'datasets',
  'datasets',
  false,
  26214400,  -- 25 MB
  array[
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/plain'  -- some browsers report CSVs as text/plain
  ]
)
on conflict (id) do nothing;

-- 5. Storage RLS — users can CRUD only files under their own user_id prefix
-- File path convention: {user_id}/{file_id}.{ext}
-- storage.foldername(name) splits on '/' — index [1] is the first folder = user_id

create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'datasets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'datasets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'datasets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'datasets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
