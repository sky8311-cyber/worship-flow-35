-- Create community_posts table for user-generated content
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.worship_communities(id) on delete cascade not null,
  author_id uuid not null,
  content text not null,
  image_urls text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.community_posts enable row level security;

-- RLS Policies for community_posts
create policy "Community members can view posts"
  on public.community_posts for select
  using (is_community_member(auth.uid(), community_id));

create policy "Community members can create posts"
  on public.community_posts for insert
  with check (is_community_member(auth.uid(), community_id) and auth.uid() = author_id);

create policy "Authors can update own posts"
  on public.community_posts for update
  using (auth.uid() = author_id);

create policy "Authors can delete own posts"
  on public.community_posts for delete
  using (auth.uid() = author_id);

-- Create post_likes table
create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  post_type text not null check (post_type in ('community_post', 'worship_set', 'calendar_event')),
  user_id uuid not null,
  created_at timestamp with time zone default now(),
  unique(post_id, user_id, post_type)
);

alter table public.post_likes enable row level security;

create policy "Users can view likes"
  on public.post_likes for select
  using (true);

create policy "Users can like posts"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- Create post_comments table
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  post_type text not null check (post_type in ('community_post', 'worship_set', 'calendar_event')),
  author_id uuid not null,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.post_comments enable row level security;

create policy "Users can view comments"
  on public.post_comments for select
  using (true);

create policy "Users can create comments"
  on public.post_comments for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own comments"
  on public.post_comments for update
  using (auth.uid() = author_id);

create policy "Authors can delete own comments"
  on public.post_comments for delete
  using (auth.uid() = author_id);

-- Add triggers for updated_at
create trigger update_community_posts_updated_at
  before update on public.community_posts
  for each row
  execute function public.update_updated_at_column();

create trigger update_post_comments_updated_at
  before update on public.post_comments
  for each row
  execute function public.update_updated_at_column();