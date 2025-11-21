-- Allow HR users to update status of analyzed resumes for their own jobs
CREATE POLICY "HR users can update analyzed resume status for their jobs"
ON public.ai_analysed_resume
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.job_listings jl
  WHERE jl.job_id = ai_analysed_resume.job_id
    AND jl.hr_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.job_listings jl
  WHERE jl.job_id = ai_analysed_resume.job_id
    AND jl.hr_user_id = auth.uid()
));