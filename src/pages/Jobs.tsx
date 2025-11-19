import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Users, Calendar } from "lucide-react";

interface Job {
  id: string;
  job_id: string;
  job_profile: string;
  company_name: string;
  status: string;
  created_at: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  vote: string;
  created_at: string;
}

export default function Jobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("job_listings")
      .select("*")
      .eq("hr_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive",
      });
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const fetchCandidates = async (jobId: string) => {
    const { data, error } = await supabase
      .from("ai_analysed_resume")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch candidates",
        variant: "destructive",
      });
    } else {
      setCandidates(data || []);
    }
  };

  const handleViewCandidates = (job: Job) => {
    setSelectedJob(job);
    setSelectedCandidates([]);
    fetchCandidates(job.job_id);
  };

  const handleSelectCandidate = (email: string) => {
    setSelectedCandidates(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c.email));
    }
  };

  const handleSendEmails = async () => {
    if (selectedCandidates.length === 0) {
      toast({
        title: "No candidates selected",
        description: "Please select at least one candidate",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        "https://n8n.srv898271.hstgr.cloud/webhook/selected_candidates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emails: selectedCandidates,
            job_profile: selectedJob?.job_profile,
            company_name: selectedJob?.company_name,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Email sent to ${selectedCandidates.length} candidate(s)`,
        });
        setSelectedCandidates([]);
      } else {
        throw new Error("Failed to send emails");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emails",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Listings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your job postings and view applicants
            </p>
          </div>
        </div>

        {!selectedJob ? (
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-8">
                  <p className="text-center text-muted-foreground">Loading jobs...</p>
                </CardContent>
              </Card>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <p className="text-center text-muted-foreground">No job listings yet</p>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">
                            {job.job_profile}
                          </h3>
                          <Badge variant={job.status === "Active" ? "default" : "secondary"}>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                          <span>Job ID: {job.job_id}</span>
                        </div>
                      </div>
                      <Button onClick={() => handleViewCandidates(job)}>
                        <Users className="h-4 w-4 mr-2" />
                        View Candidates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                ← Back to Jobs
              </Button>
              <Button
                onClick={handleSendEmails}
                disabled={selectedCandidates.length === 0 || sending}
              >
                {sending ? "Sending..." : `Send Email to ${selectedCandidates.length} Selected`}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  {selectedJob.job_profile} - Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No candidates yet for this job
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b">
                      <Checkbox
                        checked={selectedCandidates.length === candidates.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">Select All</span>
                    </div>
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.email)}
                          onCheckedChange={() => handleSelectCandidate(candidate.email)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{candidate.name}</p>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
                        </div>
                        {candidate.vote && (
                          <Badge variant="outline">Score: {candidate.vote}/10</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
