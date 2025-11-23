-- Update handle_new_user trigger to assign worship_leader role based on metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_type text;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Get user type from metadata
  user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Assign worship_leader role if specified
  IF user_type = 'worship_leader' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'worship_leader');
  END IF;
  
  RETURN NEW;
END;
$$;