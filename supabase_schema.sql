-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (Public Profile linked to Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  is_premium boolean default false,
  license_type text,
  access_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- USER USAGE TABLE (Tracks daily limits)
create table public.user_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date default current_date not null,
  chats_count int default 0,
  calculators_count int default 0,
  audits_count int default 0,
  constraint unique_user_date unique (user_id, date)
);

-- USER CREDITS TABLE (For one-off purchases)
create table public.user_credits (
  user_id uuid references public.users(id) on delete cascade primary key,
  audits_balance int default 0,
  draft_basic_balance int default 0,
  draft_custom_balance int default 0
);

-- CHAT SESSIONS TABLE
create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  messages jsonb default '[]'::jsonb
);

-- RLS POLICIES
alter table public.users enable row level security;
alter table public.user_usage enable row level security;
alter table public.user_credits enable row level security;
alter table public.chat_sessions enable row level security;

-- Policies for Users
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Policies for Usage
create policy "Users can view own usage" on public.user_usage
  for select using (auth.uid() = user_id);
-- Usage is updated by server-side functions mostly, but if client updates allowed:
create policy "Users can insert own usage" on public.user_usage
  for insert with check (auth.uid() = user_id);

-- Policies for Credits
create policy "Users can view own credits" on public.user_credits
  for select using (auth.uid() = user_id);
-- Credits are ONLY updated by service role (webhooks)

-- Policies for Chat Sessions
create policy "Users can view own sessions" on public.chat_sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.chat_sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.chat_sessions
  for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on public.chat_sessions
  for delete using (auth.uid() = user_id);

-- TRIGGER TO AUTO-CREATE USER PROFILE
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  
  insert into public.user_credits (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
