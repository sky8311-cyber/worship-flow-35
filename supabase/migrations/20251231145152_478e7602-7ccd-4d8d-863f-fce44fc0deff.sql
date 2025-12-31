-- Enable realtime for worship_leader_applications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.worship_leader_applications;

-- Enable realtime for user_roles table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;