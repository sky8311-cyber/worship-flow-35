-- Add service_time field to service_sets table
ALTER TABLE public.service_sets 
ADD COLUMN service_time TIME WITHOUT TIME ZONE;

COMMENT ON COLUMN public.service_sets.service_time IS 'Time of the worship service (HH:MM format)';