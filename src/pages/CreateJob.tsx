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
  const [enhancing, setEnhancing] = useState(false);
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
      const { data: profile } = await (supabase as any)
        .from("hr_profiles")
        .select("company_name")
        .eq("id", user.id)
        .single();

      const companyName = profile?.company_name || "Company";

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

  const handleEnhanceWithAI = async () => {
    if (!user || !jobPrompt.trim()) {
      toast.error("Please enter job details first");
      return;
    }

    setEnhancing(true);
    try {
      const { data: profile } = await (supabase as any)
        .from("hr_profiles")
        .select("company_name")
        .eq("id", user.id)
        .single();

      const companyName = profile?.company_name || "Company";

      const response = await fetch(
        "https://n8n.srv898271.hstgr.cloud/webhook/enhance_jd",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            job_description: jobPrompt,
            company_name: companyName,
            hr_user_id: user.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to enhance job description");
      }

      const data = await response.json();
      const enhancedText = Array.isArray(data) ? data[0]?.enhanced_jd : data.enhanced_jd;
      setJobPrompt(enhancedText || jobPrompt);
      toast.success("Job description enhanced successfully!");
    } catch (error: any) {
      console.error("Error enhancing job description:", error);
      toast.error(error.message || "Failed to enhance job description");
    } finally {
      setEnhancing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Card className="glass-effect border-0 card-shadow-lg">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Create Job Application Form</CardTitle>
                <CardDescription className="text-base mt-1">
                  Describe your job requirements and we'll create a structured form
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateForm} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="job-details" className="text-base font-semibold">Job Details</Label>
                <Textarea
                  id="job-details"
                  placeholder="E.g., We're looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and AWS. The role involves leading development of our main product platform..."
                  value={jobPrompt}
                  onChange={(e) => setJobPrompt(e.target.value)}
                  required
                  className="min-h-[220px] rounded-xl resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={enhancing || loading}
                  onClick={handleEnhanceWithAI}
                  className="flex-1 h-12"
                >
                  {enhancing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enhance with AI
                    </>
                  )}
                </Button>

                <Button type="submit" disabled={loading || enhancing} className="flex-1 h-12">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Creating Form...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Application Form
                    </>
                  )}
                </Button>
              </div>
            </form>

            {shareLink && (
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <Label className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Your Job Form is Ready!
                </Label>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-4 py-2.5 text-sm bg-background/50 border border-border rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="h-11 px-6"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
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
