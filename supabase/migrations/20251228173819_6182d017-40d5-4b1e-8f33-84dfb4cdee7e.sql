-- Allow users to delete their own pending applications (cancel before approval)
CREATE POLICY "Users can delete own pending applications" 
ON public.worship_leader_applications
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');