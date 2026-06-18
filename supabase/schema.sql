create extension if not exists "pgcrypto";

-- Users table mirrors auth.users (created by Supabase Auth)
-- password_hash/salt are nullable — only populated for legacy migrated users
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  password_hash text,
  salt text,
  created_at timestamptz not null default now()
);

create table if not exists user_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  project_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  upload_date timestamptz not null default now(),
  source_type text not null check (source_type in ('upload', 'sharepoint')),
  status text not null check (status in ('processing', 'needs_chunking', 'ready', 'failed')),
  chunk_count integer not null default 0,
  extracted_text text,
  page_count integer,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references knowledge_files(id) on delete cascade,
  chunk_text text not null,
  embedding_placeholder jsonb,
  page_number integer,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_files_user_id_idx on knowledge_files(user_id);
create index if not exists knowledge_chunks_file_id_idx on knowledge_chunks(file_id);
create index if not exists knowledge_chunks_text_search_idx
  on knowledge_chunks using gin(to_tsvector('english', chunk_text));

create table if not exists user_api_keys (
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  encrypted_key text not null,
  iv text not null,
  auth_tag text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

-- User data (history, qa results, suites, team, profile)
create table if not exists user_data (
  user_id uuid not null references users(id) on delete cascade,
  key text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Password reset tokens (custom, not Supabase recovery)
create table if not exists password_reset_tokens (
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  primary key (user_id)
);
