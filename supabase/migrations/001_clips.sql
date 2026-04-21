-- Dramamix: clips table with RLS
-- Run this once in the Supabase SQL Editor

create table if not exists clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text,
  prompt text,
  script jsonb,
  video_url text,
  thumbnail_url text,
  duration int,
  style text,
  genre text,
  mood text,
  parent_clip_id uuid references clips on delete set null,
  reference_image_url text,
  created_at timestamptz default now()
);

create index if not exists clips_user_id_idx on clips(user_id);
create index if not exists clips_created_at_idx on clips(created_at desc);
create index if not exists clips_parent_idx on clips(parent_clip_id);

alter table clips enable row level security;

-- Public read for all clips with a video
drop policy if exists "Public can view clips with video" on clips;
create policy "Public can view clips with video" on clips
  for select using (video_url is not null);

-- Users manage only their own
drop policy if exists "Users can insert own clips" on clips;
create policy "Users can insert own clips" on clips
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own clips" on clips;
create policy "Users can update own clips" on clips
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own clips" on clips;
create policy "Users can delete own clips" on clips
  for delete using (auth.uid() = user_id);
