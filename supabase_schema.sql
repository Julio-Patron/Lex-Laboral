-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (Public Profile linked to Auth)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text,
  is_premium boolean default false,
  license_type text,
  access_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- In case the table already exists but is missing the new premium tracking columns, add them:
alter table public.users 
  add column if not exists is_premium boolean default false,
  add column if not exists license_type text,
  add column if not exists access_until timestamptz;

-- USER USAGE TABLE (Tracks limits both daily and monthly)
create table if not exists public.user_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date default current_date not null,
  month text, -- Formato 'YYYY-MM'
  chats_count int default 0,
  calculators_count int default 0,
  audits_count int default 0,
  draft_basic_month_count int default 0,
  draft_custom_month_count int default 0,
  audits_free_used boolean default false,
  constraint unique_user_date unique (user_id, date),
  constraint unique_user_month unique (user_id, month)
);

alter table public.user_usage
  add column if not exists month text,
  add column if not exists draft_basic_month_count int default 0,
  add column if not exists draft_custom_month_count int default 0,
  add column if not exists audits_free_used boolean default false;
  
-- Creamos el constraint solo si no existe
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'unique_user_month') then
    alter table public.user_usage drop constraint if exists unique_user_month;
    alter table public.user_usage add constraint unique_user_month unique (user_id, month);
  end if;
end
$$;

-- USER CREDITS TABLE (For one-off purchases)
create table if not exists public.user_credits (
  user_id uuid references public.users(id) on delete cascade primary key,
  audits_balance int default 0,
  draft_basic_balance int default 0,
  draft_custom_balance int default 0
);

-- CHAT SESSIONS TABLE
create table if not exists public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  messages jsonb default '[]'::jsonb
);

-- INDEX FOR PERFORMANCE
create index if not exists idx_chat_sessions_user_updated on public.chat_sessions (user_id, updated_at desc);

-- RLS POLICIES
alter table public.users enable row level security;
alter table public.user_usage enable row level security;
alter table public.user_credits enable row level security;
alter table public.chat_sessions enable row level security;

-- Policies for Users
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Policies for Usage
drop policy if exists "Users can view own usage" on public.user_usage;
create policy "Users can view own usage" on public.user_usage
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own usage" on public.user_usage;
create policy "Users can insert own usage" on public.user_usage
  for insert with check (auth.uid() = user_id);

-- Policies for Credits
drop policy if exists "Users can view own credits" on public.user_credits;
create policy "Users can view own credits" on public.user_credits
  for select using (auth.uid() = user_id);

-- Policies for Chat Sessions
drop policy if exists "Users can view own sessions" on public.chat_sessions;
create policy "Users can view own sessions" on public.chat_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.chat_sessions;
create policy "Users can insert own sessions" on public.chat_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own sessions" on public.chat_sessions;
create policy "Users can update own sessions" on public.chat_sessions
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.chat_sessions;
create policy "Users can delete own sessions" on public.chat_sessions
  for delete using (auth.uid() = user_id);

-- TRIGGER TO AUTO-CREATE USER PROFILE
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  
  insert into public.user_credits (user_id, draft_basic_balance, audits_balance)
  values (new.id, 1, 1);
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
