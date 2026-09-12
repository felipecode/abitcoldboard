create table if not exists public."references" (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  submitter text not null,
  status text not null default 'inbox',
  created_at timestamptz not null default now()
);

alter table public."references" enable row level security;
