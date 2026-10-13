-- Ejecutar sobre la base de Cursiva existente. No volver a ejecutar schema.sql.
begin;
alter table public.subjects drop constraint if exists subjects_color_check;
alter table public.subjects add constraint subjects_color_check check(color in ('sage','lavender','peach','blue') or color ~ '^#[0-9A-Fa-f]{6}$');
alter table public.profiles add column if not exists timezone text not null default 'America/Argentina/Cordoba';
alter table public.assessments add column if not exists reminder_enabled boolean not null default false;

create table if not exists public.note_files (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 note_id uuid not null references public.notes(id) on delete cascade,
 path text not null unique,
 name text not null check(length(name) between 1 and 255),
 size bigint not null check(size between 5 and 10485760),
 created_at timestamptz not null default now(),
 check(path=user_id::text || '/' || note_id::text || '/' || id::text || '.pdf')
);
create index if not exists note_files_owner_note on public.note_files(user_id,note_id);
alter table public.note_files enable row level security;
revoke all on public.note_files from anon,authenticated;
grant select,insert,delete on public.note_files to authenticated;
drop policy if exists files_read on public.note_files;
create policy files_read on public.note_files for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.notes n where n.id=note_id and n.user_id=(select auth.uid())));
drop policy if exists files_insert on public.note_files;
create policy files_insert on public.note_files for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.notes n where n.id=note_id and n.user_id=(select auth.uid())));
drop policy if exists files_delete on public.note_files;
create policy files_delete on public.note_files for delete to authenticated using(user_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('note-pdfs','note-pdfs',false,10485760,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];
drop policy if exists cursiva_pdf_upload on storage.objects;
create policy cursiva_pdf_upload on storage.objects for insert to authenticated with check(
 bucket_id='note-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.notes n where n.id::text=(storage.foldername(name))[2] and n.user_id=(select auth.uid()))
);
drop policy if exists cursiva_pdf_read on storage.objects;
create policy cursiva_pdf_read on storage.objects for select to authenticated using(
 bucket_id='note-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists cursiva_pdf_delete on storage.objects;
create policy cursiva_pdf_delete on storage.objects for delete to authenticated using(bucket_id='note-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Objetos borrados: el servidor usa Storage API, nunca DELETE sobre storage.objects.
create table if not exists public.pdf_cleanup_queue(path text primary key,created_at timestamptz not null default now());
alter table public.pdf_cleanup_queue enable row level security;
revoke all on public.pdf_cleanup_queue from anon,authenticated;
grant all on public.pdf_cleanup_queue to service_role;
create or replace function public.queue_pdf_cleanup() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.pdf_cleanup_queue(path) values(old.path) on conflict do nothing; return old; end $$;
revoke all on function public.queue_pdf_cleanup() from public,anon,authenticated;
drop trigger if exists note_file_cleanup on public.note_files;
create trigger note_file_cleanup after delete on public.note_files for each row execute function public.queue_pdf_cleanup();

create table if not exists public.calendar_subscriptions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 token_hash text not null unique,
 created_at timestamptz not null default now()
);
alter table public.calendar_subscriptions enable row level security;
revoke all on public.calendar_subscriptions from anon,authenticated;
grant all on public.calendar_subscriptions to service_role;

create table if not exists public.reminder_deliveries (
 id uuid primary key default gen_random_uuid(),
 assessment_id uuid not null references public.assessments(id) on delete cascade,
 exam_date date not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 sent_at timestamptz,
 claim_until timestamptz,
 attempts integer not null default 0,
 last_error text,
 created_at timestamptz not null default now(),
 unique(assessment_id,exam_date)
);
alter table public.reminder_deliveries enable row level security;
revoke all on public.reminder_deliveries from anon,authenticated;
grant all on public.reminder_deliveries to service_role;
grant select on public.profiles,public.subjects,public.assessments to service_role;
create or replace function public.claim_reminder(delivery_id uuid) returns setof public.reminder_deliveries
language sql security definer set search_path='' as $$
 update public.reminder_deliveries set claim_until=now()+interval '2 minutes',attempts=attempts+1
 where id=delivery_id and sent_at is null and attempts<8 and (claim_until is null or claim_until<now()) returning *;
$$;
revoke all on function public.claim_reminder(uuid) from public,anon,authenticated;
grant execute on function public.claim_reminder(uuid) to service_role;
commit;
