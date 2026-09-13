create table if not exists public."references" (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  submitter text not null,
  status text not null default 'inbox',
  created_at timestamptz not null default now()
);

alter table public."references" enable row level security;

drop policy if exists "references_select" on public."references";
drop policy if exists "references_insert" on public."references";
drop policy if exists "references_update" on public."references";
drop policy if exists "references_delete" on public."references";

create policy "references_select"
on public."references"
for select
using (true);

create policy "references_insert"
on public."references"
for insert
with check (true);

create policy "references_update"
on public."references"
for update
using (true)
with check (true);

create policy "references_delete"
on public."references"
for delete
using (true);

insert into storage.buckets (id, name, public)
values ('references', 'references', false)
on conflict (id) do nothing;

drop policy if exists "references_storage_select" on storage.objects;
drop policy if exists "references_storage_insert" on storage.objects;
drop policy if exists "references_storage_delete" on storage.objects;

create policy "references_storage_select"
on storage.objects
for select
using (bucket_id = 'references');

create policy "references_storage_insert"
on storage.objects
for insert
with check (bucket_id = 'references');

create policy "references_storage_delete"
on storage.objects
for delete
using (bucket_id = 'references');
