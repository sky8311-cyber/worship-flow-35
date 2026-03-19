
-- Admin policies for institute tables (admin = user_roles.role = 'admin')
-- Using the same pattern as other admin tables

-- institute_courses: admin can do everything
CREATE POLICY "Admins can manage courses"
  ON public.institute_courses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- institute_modules: admin can do everything
CREATE POLICY "Admins can manage modules"
  ON public.institute_modules FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- institute_enrollments: admin can read all
CREATE POLICY "Admins can view all enrollments"
  ON public.institute_enrollments FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- institute_badges: admin can manage badges
CREATE POLICY "Admins can manage badges"
  ON public.institute_badges FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
