-- Add status column to ai_analysed_resume table to track candidate status
ALTER TABLE public.ai_analysed_resume 
ADD COLUMN status text DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'rejected', 'interviewed'));

-- Create index for better performance when filtering by status
CREATE INDEX idx_ai_analysed_resume_status ON public.ai_analysed_resume(status);

-- Create index for better performance when filtering by job_id and status together
CREATE INDEX idx_ai_analysed_resume_job_status ON public.ai_analysed_resume(job_id, status);