-- Add foreign key constraint from community_posts.author_id to profiles.id
alter table public.community_posts
  add constraint community_posts_author_id_fkey
  foreign key (author_id)
  references public.profiles(id)
  on delete cascade;

-- Add foreign key constraint from post_comments.author_id to profiles.id
alter table public.post_comments
  add constraint post_comments_author_id_fkey
  foreign key (author_id)
  references public.profiles(id)
  on delete cascade;