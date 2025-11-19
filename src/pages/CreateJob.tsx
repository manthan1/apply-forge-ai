import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Copy, Check } from "lucide-react";

export default function CreateJob() {
  const { user } = useAuth();
  const [jobPrompt, setJobPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const generateShortId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get company name from hr_profiles
      const { data: profile } = await (supabase as any)
        .from("hr_profiles")
        .select("company_name")
        .eq("id", user.id)
        .single();

      const companyName = profile?.company_name || "Company";

      // Send request to n8n webhook
      const response = await fetch(
        "https://n8n.srv898271.hstgr.cloud/webhook/12476c6f-1a18-4c55-ba77-4637fb441355",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            job_prompt: jobPrompt,
            hr_user_id: user.id,
            company_name: companyName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create job listing");
      }

      const webhookData = await response.json();
      
      // Generate short link
      const shortId = generateShortId();
      const { error: shortlinkError } = await (supabase as any)
        .from("shortlinks")
        .insert({
          id: shortId,
          job_listing_id: webhookData.id,
        });

      if (shortlinkError) throw shortlinkError;

      const link = `${window.location.origin}/apply?id=${webhookData.id}`;
      setShareLink(link);
      
      toast.success("Job form created successfully!");
      setJobPrompt("");
    } catch (error: any) {
      console.error("Error creating job:", error);
      toast.error(error.message || "Failed to create job form");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

      <DashboardLayout>
      
      <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Create Dynamic Job Application Form
              </CardTitle>
              <CardDescription>
                Describe your job requirements in plain English and we'll create a structured application form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateForm} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="job-details">Job Details</Label>
                  <Textarea
                    id="job-details"
                    placeholder="E.g., We're looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and AWS. The role involves leading development of our main product platform..."
                    value={jobPrompt}
                    onChange={(e) => setJobPrompt(e.target.value)}
                    required
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe the job role, requirements, responsibilities, and any other relevant details
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Creating Form...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Form
                    </>
                  )}
                </Button>
              </form>

              {shareLink && (
                <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-sm font-medium text-success mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Form created successfully!
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this link with candidates to collect applications
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
  );
}
