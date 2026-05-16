-- Pantri database schema
-- Run this in the Supabase SQL editor to set up your database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- USERS
-- =====================
-- Mirrors Clerk users; populated via webhook
create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  clerk_id    text unique not null,
  email       text unique not null,
  name        text,
  avatar_url  text,
  plan        text not null default 'free' check (plan in ('free', 'pro')),
  ai_uses_this_week int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================
-- USER PREFERENCES
-- =====================
create table if not exists user_preferences (
  user_id            uuid primary key references users(id) on delete cascade,
  servings           int not null default 2,
  dietary_prefs      text[] default '{}',
  allergies          text[] default '{}',
  cuisine_favorites  text[] default '{}',
  updated_at         timestamptz not null default now()
);

-- =====================
-- FAMILIES
-- =====================
create table if not exists families (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  owner_id   uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists family_members (
  id         uuid primary key default uuid_generate_v4(),
  family_id  uuid not null references families(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  unique (family_id, user_id)
);

-- =====================
-- RECIPES
-- =====================
create table if not exists recipes (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  cuisine     text not null,
  cook_time   int not null,  -- minutes
  prep_time   int not null,  -- minutes
  servings    int not null default 2,
  source      text not null default 'seed' check (source in ('seed', 'ai', 'user')),
  tags        text[] default '{}',
  ingredients jsonb not null default '[]',  -- [{amount, item}]
  steps       jsonb not null default '[]',  -- [string]
  macros      jsonb not null default '{}',  -- {calories, protein, carbs, fat}
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- =====================
-- MEAL PLANS
-- =====================
create table if not exists meal_plans (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  week_start  date not null,  -- Monday of the week
  created_at  timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists meal_plan_days (
  id            uuid primary key default uuid_generate_v4(),
  meal_plan_id  uuid not null references meal_plans(id) on delete cascade,
  day_of_week   text not null check (day_of_week in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  meal_type     text not null default 'dinner' check (meal_type in ('breakfast','lunch','dinner','snack')),
  recipe_id     uuid references recipes(id) on delete set null,
  unique (meal_plan_id, day_of_week, meal_type)
);

-- =====================
-- GROCERY LISTS
-- =====================
create table if not exists grocery_lists (
  id            uuid primary key default uuid_generate_v4(),
  meal_plan_id  uuid not null references meal_plans(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  items         jsonb not null default '[]',  -- [{name, amount, category, checked}]
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =====================
-- FORUM
-- =====================
create table if not exists forum_posts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  category    text not null check (category in ('recipe-swaps','grocery-hacks','cuisine-deep-dives','ai-prompt-tips')),
  title       text not null,
  body        text not null,
  upvotes     int not null default 0,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists forum_replies (
  id        uuid primary key default uuid_generate_v4(),
  post_id   uuid not null references forum_posts(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  body      text not null,
  upvotes   int not null default 0,
  created_at timestamptz not null default now()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table users enable row level security;
alter table user_preferences enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table recipes enable row level security;
alter table meal_plans enable row level security;
alter table meal_plan_days enable row level security;
alter table grocery_lists enable row level security;
alter table forum_posts enable row level security;
alter table forum_replies enable row level security;

-- Users can read/update their own record
create policy "users_self" on users
  using (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- User preferences owned by user
create policy "prefs_self" on user_preferences
  using (user_id = (select id from users where clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Recipes: seed recipes are public; ai/user recipes readable by creator
create policy "recipes_seed_public" on recipes
  for select using (source = 'seed');
create policy "recipes_owner" on recipes
  using (created_by = (select id from users where clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Meal plans owned by user
create policy "meal_plans_owner" on meal_plans
  using (user_id = (select id from users where clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Grocery lists owned by user
create policy "grocery_owner" on grocery_lists
  using (user_id = (select id from users where clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Forum posts readable by all, writable by author
create policy "forum_posts_read" on forum_posts for select using (true);
create policy "forum_posts_write" on forum_posts
  using (user_id = (select id from users where clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

create policy "forum_replies_read" on forum_replies for select using (true);
create policy "forum_replies_write" on forum_replies
  using (user_id = (select id from users where clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));
