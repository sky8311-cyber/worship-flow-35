INSERT INTO public.navigation_items (key, location, label_key, icon, path, match_pattern, enabled, order_index, is_system)
VALUES ('institute', 'bottom', 'navigation.institute', 'GraduationCap', '/institute', '/institute', true, 4, true)
ON CONFLICT (key) DO NOTHING;