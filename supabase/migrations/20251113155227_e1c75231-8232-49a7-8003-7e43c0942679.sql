-- Create hr_profiles table
CREATE TABLE public.hr_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on hr_profiles
ALTER TABLE public.hr_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hr_profiles
CREATE POLICY "HR users can view their own profile"
  ON public.hr_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "HR users can update their own profile"
  ON public.hr_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create job_listings table
CREATE TABLE public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT UNIQUE NOT NULL,
  job_profile TEXT NOT NULL,
  job_description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  hr_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on job_listings
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_listings
CREATE POLICY "Anyone can view active jobs"
  ON public.job_listings FOR SELECT
  USING (status = 'Active' OR auth.uid() = hr_user_id);

CREATE POLICY "HR users can create jobs"
  ON public.job_listings FOR INSERT
  WITH CHECK (auth.uid() = hr_user_id);

CREATE POLICY "HR users can update their own jobs"
  ON public.job_listings FOR UPDATE
  USING (auth.uid() = hr_user_id);

CREATE POLICY "HR users can delete their own jobs"
  ON public.job_listings FOR DELETE
  USING (auth.uid() = hr_user_id);

-- Create applicants table
CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cv_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on applicants
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applicants
CREATE POLICY "Anyone can insert applicants"
  ON public.applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "HR users can view applicants for their jobs"
  ON public.applicants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_listings
      WHERE job_listings.job_id = applicants.job_id
      AND job_listings.hr_user_id = auth.uid()
    )
  );

-- Create ai_analysed_resume table
CREATE TABLE public.ai_analysed_resume (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  city TEXT,
  email TEXT,
  educational_details TEXT,
  job_history TEXT,
  skills TEXT,
  summarize TEXT,
  vote TEXT,
  consideration TEXT,
  cv_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on ai_analysed_resume
ALTER TABLE public.ai_analysed_resume ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_analysed_resume
CREATE POLICY "Anyone can insert analyzed resumes"
  ON public.ai_analysed_resume FOR INSERT
  WITH CHECK (true);

CREATE POLICY "HR users can view analyzed resumes for their jobs"
  ON public.ai_analysed_resume FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_listings
      WHERE job_listings.job_id = ai_analysed_resume.job_id
      AND job_listings.hr_user_id = auth.uid()
    )
  );

-- Create shortlinks table for job application URLs
CREATE TABLE public.shortlinks (
  id TEXT PRIMARY KEY,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on shortlinks
ALTER TABLE public.shortlinks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shortlinks
CREATE POLICY "Anyone can view shortlinks"
  ON public.shortlinks FOR SELECT
  USING (true);

CREATE POLICY "HR users can create shortlinks"
  ON public.shortlinks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_listings
      WHERE job_listings.id = shortlinks.job_listing_id
      AND job_listings.hr_user_id = auth.uid()
    )
  );

-- Function to generate job_id
CREATE OR REPLACE FUNCTION public.generate_job_id()
RETURNS TRIGGER AS $$
DECLARE
  company_initials TEXT;
  next_number INTEGER;
  new_job_id TEXT;
BEGIN
  -- Get company initials (first letters of each word)
  SELECT string_agg(substring(word, 1, 1), '')
  INTO company_initials
  FROM regexp_split_to_table(upper(NEW.company_name), '\s+') AS word;
  
  -- If no initials, use first 4 chars
  IF company_initials IS NULL OR company_initials = '' THEN
    company_initials := upper(substring(NEW.company_name, 1, 4));
  END IF;
  
  -- Get next number for this company
  SELECT COALESCE(MAX(
    CAST(
      substring(job_id FROM '[0-9]+$') AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM public.job_listings
  WHERE job_id LIKE company_initials || '-%';
  
  -- Generate new job_id
  new_job_id := company_initials || '-' || lpad(next_number::TEXT, 4, '0');
  
  NEW.job_id := new_job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-generating job_id
CREATE TRIGGER set_job_id_trigger
  BEFORE INSERT ON public.job_listings
  FOR EACH ROW
  WHEN (NEW.job_id IS NULL OR NEW.job_id = '')
  EXECUTE FUNCTION public.generate_job_id();

-- Function to handle HR user creation
CREATE OR REPLACE FUNCTION public.handle_hr_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  company_initials TEXT;
BEGIN
  -- Extract initials from company_name in metadata
  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    SELECT string_agg(substring(word, 1, 1), '')
    INTO company_initials
    FROM regexp_split_to_table(
      upper(NEW.raw_user_meta_data->>'company_name'), 
      '\s+'
    ) AS word;
    
    -- If no initials, use first 4 chars
    IF company_initials IS NULL OR company_initials = '' THEN
      company_initials := upper(substring(
        NEW.raw_user_meta_data->>'company_name', 
        1, 
        4
      ));
    END IF;
    
    -- Insert into hr_profiles
    INSERT INTO public.hr_profiles (id, company_name, initials)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'company_name',
      company_initials
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for HR user signup
CREATE TRIGGER on_hr_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_hr_user_signup();

-- Add updated_at trigger for hr_profiles
CREATE TRIGGER update_hr_profiles_updated_at
  BEFORE UPDATE ON public.hr_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for job_listings
CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON public.job_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket
CREATE POLICY "Anyone can upload resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Anyone can view resumes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes');

CREATE POLICY "HR users can delete resumes for their jobs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    EXISTS (
      SELECT 1 FROM public.applicants
      WHERE applicants.cv_url LIKE '%' || storage.objects.name || '%'
      AND EXISTS (
        SELECT 1 FROM public.job_listings
        WHERE job_listings.job_id = applicants.job_id
        AND job_listings.hr_user_id = auth.uid()
      )
    )
  );