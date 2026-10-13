-- Cursiva: ejecutar una vez en Supabase > SQL Editor.
-- Migración inicial: aborta sin cambios si ya existen tablas con estos nombres.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(length(full_name) between 1 and 80),
 career text not null check(length(career) between 1 and 160),
 university text not null default '',
 years integer not null check(years between 1 and 15),
 current_year integer not null check(current_year between 1 and years)
);
create table public.subjects (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 120),
 year integer not null check(year between 1 and 15),
 semester text not null default '1.º cuatrimestre',
 teacher text not null default '', schedule text not null default '', description text not null default '',
 color text not null default 'sage' check(color in ('sage','lavender','peach','blue')),
 status text not null default 'Cursando' check(status in ('Por cursar','Cursando','Regular','Aprobada')),
 unique(id,user_id)
);
create table public.assessments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 subject_id uuid not null,
 title text not null check(length(title) between 1 and 140),
 type text not null check(type in ('Parcial','Trabajo práctico','Final','Recuperatorio','Actividad')),
 date date not null, topics text not null default '',
 status text not null default 'Pendiente' check(status in ('Pendiente','Aprobado','Desaprobado','A recuperar','Completado')),
 grade text not null default '', weight integer not null default 1 check(weight between 0 and 1000),
 recovery_of uuid,
 unique(id,user_id),
 foreign key(subject_id,user_id) references public.subjects(id,user_id) on delete cascade,
 foreign key(recovery_of,user_id) references public.assessments(id,user_id) on delete no action deferrable initially deferred
);
create table public.notes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 subject_id uuid not null,
 title text not null check(length(title) between 1 and 160),
 content text not null default '' check(length(content)<=50000),
 url text not null default '' check(url='' or url ~* '^https?://'),
 created_at timestamptz not null default now(),
 foreign key(subject_id,user_id) references public.subjects(id,user_id) on delete cascade
);
create index subjects_owner on public.subjects(user_id);
create index assessments_owner_date on public.assessments(user_id,date);
create index notes_owner on public.notes(user_id);
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.assessments enable row level security;
alter table public.notes enable row level security;
revoke all on public.profiles,public.subjects,public.assessments,public.notes from anon,authenticated;
grant select,insert,update,delete on public.profiles,public.subjects,public.assessments,public.notes to authenticated;
create policy profile_read on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy profile_add on public.profiles for insert to authenticated with check ((select auth.uid())=id);
create policy profile_edit on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy profile_delete on public.profiles for delete to authenticated using ((select auth.uid())=id);
do $$ declare t text; begin
 foreach t in array array['subjects','assessments','notes'] loop
 execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 execute format('create policy owner_add on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_edit on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
end $$;
commit;
