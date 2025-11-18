import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Job Creation</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Create Your Job Application Form
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Describe your job requirements in plain English and our AI will create a structured, shareable application form instantly
            </p>
          </div>

          <Card className="border-2 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
              <CardTitle className="text-2xl">Job Details</CardTitle>
              <CardDescription className="text-base">
                Tell us about the position you're hiring for
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateForm} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="job-details" className="text-base font-semibold">
                    Describe Your Job Opening
                  </Label>
                  <Textarea
                    id="job-details"
                    placeholder="Example: We're looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and AWS. The role involves leading development of our main product platform, mentoring junior developers, and collaborating with cross-functional teams..."
                    value={jobPrompt}
                    onChange={(e) => setJobPrompt(e.target.value)}
                    required
                    rows={10}
                    className="resize-none text-base"
                  />
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Include job title, required skills, experience level, key responsibilities, and any specific requirements
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-12 text-base font-semibold shadow-lg"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⚡</span>
                      Generating Your Form...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Application Form
                    </>
                  )}
                </Button>
              </form>

              {shareLink && (
                <div className="mt-8 p-6 bg-gradient-to-r from-success/10 via-success/5 to-transparent rounded-xl border-2 border-success/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-success" />
                    <Label className="text-lg font-semibold text-foreground">Job Form Created Successfully!</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share this link with candidates to receive applications
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-background rounded-lg border-2">
                    <code className="flex-1 text-sm font-mono text-primary truncate select-all">
                      {shareLink}
                    </code>
                    <Button
                      type="button"
                      variant={copied ? "default" : "outline"}
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
