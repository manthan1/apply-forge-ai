-- Add new columns to job_listings table for additional job details
ALTER TABLE public.job_listings 
ADD COLUMN education_required TEXT,
ADD COLUMN location_type TEXT,
ADD COLUMN expected_salary TEXT;