-- Add interview_questions column to job_listings table
ALTER TABLE public.job_listings
ADD COLUMN interview_questions text;