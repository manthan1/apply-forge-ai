import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Briefcase, Upload, CheckCircle2, AlertCircle, Building2, MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";

interface JobListing {
  id: string;
  job_id: string;
  job_profile: string;
  job_description: string;
  company_name: string;
  status: string;
  education_required?: string;
  location_type?: string;
  expected_salary?: string;
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
        let { data, error } = await (supabase as any)
          .from("job_listings")
          .select("*")
          .eq("id", jobId)
          .single();

        if (error) {
          const { data: shortlink } = await (supabase as any)
            .from("shortlinks")
            .select("job_listing_id")
            .eq("id", jobId)
            .single();

          if (shortlink) {
            const response = await (supabase as any)
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

      const { error: insertError } = await (supabase as any)
        .from("applicants")
        .insert({
          job_id: job.job_id,
          name: formData.name,
          email: formData.email,
          cv_url: publicUrl,
        });

      if (insertError) throw insertError;

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full border-border/50 shadow-lg">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full border-border/50 shadow-lg">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Position Closed</h2>
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full border-border/50 shadow-lg">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your application. We'll review your profile and get back to you soon.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-left">
              <p className="font-medium mb-1">What's next?</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Our AI will analyze your resume</li>
                <li>• HR team will review your application</li>
                <li>• You'll hear from us within 5 business days</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-primary/10 rounded-xl">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{job.job_profile}</CardTitle>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <span>{job.company_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>Job ID: {job.job_id}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Job Description */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">About the Role</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {job.job_description}
              </p>
            </div>

            {/* Job Requirements */}
            {(job.education_required || job.location_type || job.expected_salary) && (
              <div className="grid gap-4 md:grid-cols-3">
                {job.education_required && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">EDUCATION</p>
                    <p className="text-sm font-semibold">{job.education_required}</p>
                  </div>
                )}
                {job.location_type && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">LOCATION</p>
                    <p className="text-sm font-semibold capitalize">{job.location_type}</p>
                  </div>
                )}
                {job.expected_salary && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">SALARY</p>
                    <p className="text-sm font-semibold">{job.expected_salary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Application Form */}
            <div className="pt-6 border-t border-border/50">
              <h3 className="font-semibold text-2xl mb-6">Apply for this Position</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cv" className="text-sm font-medium">
                    Resume/CV (PDF only) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="cv"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.type !== "application/pdf") {
                          toast.error("Please upload a PDF file");
                          e.target.value = "";
                          return;
                        }
                        setFormData({ ...formData, cvFile: file || null });
                      }}
                      required
                      className="h-11"
                    />
                    {formData.cvFile && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>{formData.cvFile.name}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload your resume in PDF format. Maximum file size: 10MB
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">AI-Powered Screening:</span> Your resume will be automatically analyzed by our AI system to match your skills and experience with the job requirements.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting || !formData.cvFile} 
                  className="w-full h-11 text-base gap-2"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Submit Application
                    </>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          By submitting this application, you agree to our processing of your data for recruitment purposes.
        </p>
      </div>
      <Footer />
    </div>
  );
}
