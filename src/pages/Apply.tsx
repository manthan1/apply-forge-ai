import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Briefcase, Upload, CheckCircle2, AlertCircle } from "lucide-react";

interface JobListing {
  id: string;
  job_id: string;
  job_profile: string;
  job_description: string;
  company_name: string;
  status: string;
}

export default function Apply() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("id");
  
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cvFile: null as File | null,
  });

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setLoading(false);
        return;
      }

      try {
        // Try to fetch by UUID first
        let { data, error } = await supabase
          .from("job_listings")
          .select("*")
          .eq("id", jobId)
          .single();

        // If not found, try shortlink
        if (error) {
          const { data: shortlink } = await supabase
            .from("shortlinks")
            .select("job_listing_id")
            .eq("id", jobId)
            .single();

          if (shortlink) {
            const response = await supabase
              .from("job_listings")
              .select("*")
              .eq("id", shortlink.job_listing_id)
              .single();
            
            data = response.data;
            error = response.error;
          }
        }

        if (error) throw error;
        setJob(data);
      } catch (error) {
        console.error("Error fetching job:", error);
        toast.error("Job not found");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !formData.cvFile) return;

    setSubmitting(true);
    try {
      // Upload CV to Supabase Storage
      const fileExt = formData.cvFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${job.job_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, formData.cvFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      // Save applicant data
      const { error: insertError } = await supabase
        .from("applicants")
        .insert({
          job_id: job.job_id,
          name: formData.name,
          email: formData.email,
          cv_url: publicUrl,
        });

      if (insertError) throw insertError;

      // Send to webhook for AI analysis
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("cv_url", publicUrl);
      formDataToSend.append("job_id", job.job_id);
      formDataToSend.append("company_name", job.company_name);
      formDataToSend.append("job_profile", job.job_profile);
      formDataToSend.append("cv", formData.cvFile);

      await fetch("https://n8n.srv898271.hstgr.cloud/webhook/HR_resume_analyzer", {
        method: "POST",
        body: formDataToSend,
      });

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground">
              The job listing you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (job.status === "Closed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Position Closed</h2>
            <p className="text-muted-foreground">
              This job is no longer accepting applications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for your application. We'll review your profile and get back to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">{job.job_profile}</CardTitle>
                <CardDescription className="text-base">{job.company_name}</CardDescription>
                <p className="text-sm text-muted-foreground mt-1">Job ID: {job.job_id}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Job Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{job.job_description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Apply for this Position</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv">Upload CV (PDF only)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cv"
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setFormData({ ...formData, cvFile: e.target.files?.[0] || null })
                    }
                    required
                    className="cursor-pointer"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Please upload your resume in PDF format
                </p>
              </div>

              <div className="space-y-2">
                <Label>Job Role</Label>
                <Input value={job.job_profile} disabled className="bg-muted" />
              </div>

              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Submitting Application...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
