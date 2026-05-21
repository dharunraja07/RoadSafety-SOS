-- RoadSoS Database Schema
-- Run this entire file in the Supabase SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  action_type text not null,
  latitude double precision,
  longitude double precision,
  timestamp timestamptz not null default now()
);

create index if not exists usage_logs_user_id_idx on public.usage_logs (user_id);
create index if not exists usage_logs_timestamp_idx on public.usage_logs (timestamp desc);
create index if not exists usage_logs_action_type_idx on public.usage_logs (action_type);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.usage_logs enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Users can insert own logs" on public.usage_logs;
create policy "Users can insert own logs"
  on public.usage_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own logs" on public.usage_logs;
create policy "Users can view own logs"
  on public.usage_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all usage logs" on public.usage_logs;
create policy "Admins can view all usage logs"
  on public.usage_logs for select
  using (public.is_admin());

alter publication supabase_realtime add table public.usage_logs;
