-- Allow backend trigger to insert default roles during signup
create policy "System can assign default roles"
on public.user_roles
for insert
with check (auth.uid() is null);

-- Allow backend trigger to create profiles during signup
create policy "System can create profiles"
on public.profiles
for insert
with check (auth.uid() is null);