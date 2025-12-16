-- Add ranking_criteria column to job_listings table
ALTER TABLE public.job_listings 
ADD COLUMN ranking_criteria TEXT;