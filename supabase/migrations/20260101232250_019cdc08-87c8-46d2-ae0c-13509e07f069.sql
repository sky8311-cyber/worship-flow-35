-- Fix infinite recursion by recreating function with SECURITY DEFINER
-- Using CREATE OR REPLACE to avoid dependency issues with existing RLS policies

CREATE OR REPLACE FUNCTION shares_community_membership(_user_id uuid, _target_community_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.community_members
    WHERE user_id = _user_id 
      AND community_id = _target_community_id
  )
$$;