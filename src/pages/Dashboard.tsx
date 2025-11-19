import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleMatchProgress } from "@/components/RoleMatchProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Users, Briefcase, Clock, Calendar, Search, ThumbsUp, ThumbsDown, MapPin, Mail, Phone, Download, Send, Filter, TrendingUp } from "lucide-react";

interface AnalyzedResume {
  id: string;
  job_id: string;
  name: string;
  phone: string;
  city: string;
  email: string;
  educational_details: string;
  job_history: string;
  skills: string;
  summarize: string;
  vote: string;
  consideration: string;
  cv_url: string;
  created_at: string;
}

interface JobListing {
  id: string;
  job_id: string;
  job_profile: string;
  company_name: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchJobId, setSearchJobId] = useState("");
  const [candidates, setCandidates] = useState<AnalyzedResume[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [applicantCount, setApplicantCount] = useState<Record<string, number>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<AnalyzedResume | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isJobSpecificView, setIsJobSpecificView] = useState(false);
  const [currentJobProfile, setCurrentJobProfile] = useState("");
  const [currentCompanyName, setCurrentCompanyName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
    }
  }, [user?.id]);

  const fetchJobs = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from("job_listings")
        .select("*")
        .eq("hr_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      
      if (data && data.length > 0) {
        const jobIds = data.map((job: any) => job.job_id);
        const { data: applicantsData, error: applicantsError } = await (supabase as any)
          .from("ai_analysed_resume")
          .select("job_id")
          .in("job_id", jobIds);
        
        if (!applicantsError && applicantsData) {
          const counts: Record<string, number> = {};
          applicantsData.forEach((app: any) => {
            counts[app.job_id] = (counts[app.job_id] || 0) + 1;
          });
          setApplicantCount(counts);
        }
      }
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load job listings");
    }
  };

  const handleViewJobCandidates = async (jobId: string) => {
    setLoading(true);
    setSearchJobId(jobId);
    setIsJobSpecificView(true);
    setSelectedEmails([]);
    
    try {
      const job = jobs.find(j => j.job_id === jobId);
      if (job) {
        setCurrentJobProfile(job.job_profile);
        setCurrentCompanyName(job.company_name);
      }
      
      const { data: resumeData, error: resumeError } = await (supabase as any)
        .from("ai_analysed_resume")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (resumeError) throw resumeError;
      
      if (!resumeData || resumeData.length === 0) {
        toast.info("No candidates have applied yet for this job.");
        setCandidates([]);
        return;
      }

      const emails = resumeData.map((r: any) => r.email);
      const { data: applicantsData, error: applicantsError } = await (supabase as any)
        .from("applicants")
        .select("email, cv_url")
        .in("email", emails)
        .eq("job_id", jobId);

      if (applicantsError) throw applicantsError;

      const cvUrlMap = new Map(applicantsData?.map((a: any) => [a.email, a.cv_url]) || []);
      const mergedData = resumeData.map((resume: any) => ({
        ...resume,
        cv_url: cvUrlMap.get(resume.email) || resume.cv_url
      }));
      
      setCandidates(mergedData);
    } catch (error: any) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchJobId.trim()) {
      toast.error("Please enter a Job ID");
      return;
    }
    await handleViewJobCandidates(searchJobId.trim());
  };

  const handleViewAll = async () => {
    setLoading(true);
    setSearchJobId("");
    setIsJobSpecificView(false);
    setSelectedEmails([]);
    setCurrentJobProfile("");
    setCurrentCompanyName("");
    try {
      const jobIds = jobs.map(job => job.job_id);
      
      const { data: resumeData, error: resumeError } = await (supabase as any)
        .from("ai_analysed_resume")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (resumeError) throw resumeError;
      
      if (!resumeData || resumeData.length === 0) {
        toast.info("No candidates have applied yet.");
        setCandidates([]);
        return;
      }

      const emails = resumeData.map((r: any) => r.email);
      const { data: applicantsData, error: applicantsError } = await (supabase as any)
        .from("applicants")
        .select("email, cv_url, job_id")
        .in("email", emails)
        .in("job_id", jobIds);

      if (applicantsError) throw applicantsError;

      const cvUrlMap = new Map(
        applicantsData?.map((a: any) => [`${a.email}_${a.job_id}`, a.cv_url]) || []
      );
      const mergedData = resumeData.map((resume: any) => ({
        ...resume,
        cv_url: cvUrlMap.get(`${resume.email}_${resume.job_id}`) || resume.cv_url
      }));
      
      setCandidates(mergedData);
    } catch (error: any) {
      console.error("Error fetching all candidates:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const getVotePercentage = (vote: string) => {
    const voteNum = parseFloat(vote);
    if (isNaN(voteNum)) return 0;
    return Math.round((voteNum / 10) * 100);
  };

  const getRowBackgroundClass = (vote: string) => {
    const voteNum = parseFloat(vote);
    if (isNaN(voteNum)) return "";
    
    if (voteNum >= 8) {
      return "bg-success/10 hover:bg-success/20";
    } else if (voteNum >= 5) {
      return "bg-warning/10 hover:bg-warning/20";
    }
    return "";
  };

  const handleSelectCandidate = (email: string, checked: boolean) => {
    if (!isJobSpecificView) {
      toast.warning("Candidate selection is only available when viewing candidates for a specific Job ID.");
      return;
    }
    
    if (checked) {
      setSelectedEmails(prev => [...prev, email]);
    } else {
      setSelectedEmails(prev => prev.filter(e => e !== email));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!isJobSpecificView) {
      toast.warning("Candidate selection is only available when viewing candidates for a specific Job ID.");
      return;
    }
    
    if (checked) {
      setSelectedEmails(candidates.map(c => c.email));
    } else {
      setSelectedEmails([]);
    }
  };

  const handleSendEmailToSelected = async () => {
    if (!isJobSpecificView) {
      toast.warning("Candidate selection is only available when viewing candidates for a specific Job ID.");
      return;
    }
    
    if (selectedEmails.length === 0) {
      toast.error("Please select at least one candidate.");
      return;
    }
    
    if (!currentJobProfile || !currentCompanyName) {
      toast.error("Job information is missing. Please try again.");
      return;
    }
    
    try {
      const response = await fetch("https://n8n.srv898271.hstgr.cloud/webhook/selected_candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: selectedEmails,
          job_profile: currentJobProfile,
          company_name: currentCompanyName,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send emails");
      }
      
      toast.success(`Email sent to ${selectedEmails.length} candidate(s) successfully!`);
      setSelectedEmails([]);
    } catch (error: any) {
      console.error("Error sending emails:", error);
      toast.error("Failed to send emails to candidates");
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Closed" : "Active";
    
    try {
      const { error } = await (supabase as any)
        .from("job_listings")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) throw error;
      
      toast.success(`Job ${newStatus === "Active" ? "reopened" : "closed"} successfully`);
      fetchJobs();
    } catch (error: any) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalCandidates = Object.values(applicantCount).reduce((a, b) => a + b, 0);
  const activeRoles = jobs.filter(j => j.status === "Active").length;

  const filteredCandidates = statusFilter === "all" 
    ? candidates 
    : candidates.filter(c => {
        const vote = parseFloat(c.vote);
        if (statusFilter === "new") return isNaN(vote) || vote < 5;
        if (statusFilter === "shortlisted") return vote >= 5 && vote < 8;
        if (statusFilter === "interviewing") return vote >= 8;
        return true;
      });

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Good morning, {user?.email?.split("@")[0] || "Alex"}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your hiring pipeline.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Candidates"
          value={totalCandidates}
          icon={Users}
          iconColor="bg-blue-500"
          trend="+12%"
          trendColor="text-green-600 bg-green-50"
        />
        <MetricCard
          title="Active Roles"
          value={activeRoles}
          icon={Briefcase}
          iconColor="bg-teal-500"
          trend="2 filled"
          trendColor="text-teal-600 bg-teal-50"
        />
        <MetricCard
          title="Pending Review"
          value={candidates.filter(c => parseFloat(c.vote) >= 5).length}
          icon={Clock}
          iconColor="bg-amber-500"
          trend="+5 today"
          trendColor="text-amber-600 bg-amber-50"
        />
        <MetricCard
          title="Interviews"
          value={candidates.filter(c => parseFloat(c.vote) >= 8).length}
          icon={Calendar}
          iconColor="bg-red-500"
          trend="This week"
          trendColor="text-green-600 bg-green-50"
        />
      </div>

      {/* Search Bar */}
      <Card className="mb-8 border-border/50">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchJobId}
                onChange={(e) => setSearchJobId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search by Job ID
            </Button>
            <Button onClick={handleViewAll} disabled={loading}>
              View All Candidates
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Section */}
      {candidates.length > 0 && (
        <Card className="mb-8 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Candidates</CardTitle>
              {isJobSpecificView && (
                <Button 
                  onClick={handleSendEmailToSelected}
                  disabled={selectedEmails.length === 0}
                  className="gap-2"
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                  Send to Selected ({selectedEmails.length})
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Manage your talent pipeline.</p>
          </CardHeader>
          <CardContent>
            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
                <TabsTrigger value="interviewing">Interviewing</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Candidates Table */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    {isJobSpecificView && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEmails.length === filteredCandidates.length && filteredCandidates.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                      </TableHead>
                    )}
                    <TableHead className="font-semibold">CANDIDATE</TableHead>
                    <TableHead className="font-semibold">ROLE MATCH</TableHead>
                    <TableHead className="font-semibold">EXPERIENCE</TableHead>
                    <TableHead className="font-semibold">APPLIED</TableHead>
                    <TableHead className="font-semibold">STATUS</TableHead>
                    <TableHead className="font-semibold">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow 
                      key={candidate.id}
                      className={`${getRowBackgroundClass(candidate.vote || "")} cursor-pointer`}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      {isJobSpecificView && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedEmails.includes(candidate.email)}
                            onCheckedChange={(checked) => handleSelectCandidate(candidate.email, checked as boolean)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {candidate.name?.substring(0, 2).toUpperCase() || "NA"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{candidate.name}</p>
                            <p className="text-sm text-muted-foreground">{candidate.city}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleMatchProgress percentage={getVotePercentage(candidate.vote || "0")} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {candidate.job_history ? (candidate.job_history.split('\n')[0].substring(0, 50) + "...") : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(candidate.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={
                          parseFloat(candidate.vote) >= 8 ? "interviewing" : 
                          parseFloat(candidate.vote) >= 5 ? "shortlisted" : "new"
                        } />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(candidate.cv_url, "_blank");
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedCandidate && (
            <>
              <SheetHeader className="space-y-4 pb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {selectedCandidate.name?.substring(0, 2).toUpperCase() || "NA"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-2xl">{selectedCandidate.name}</SheetTitle>
                    <SheetDescription>{currentJobProfile || "Candidate"}</SheetDescription>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2 bg-emerald-500 hover:bg-emerald-600">
                    <ThumbsUp className="h-4 w-4" />
                    Shortlist
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive">
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button className="flex-1 gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </Button>
                </div>

                {/* Tabs for Overview, Interview Guide, Email */}
                <div className="flex gap-4 text-sm border-b">
                  <button className="pb-2 border-b-2 border-primary text-primary font-medium">
                    Overview
                  </button>
                  <button className="pb-2 text-muted-foreground hover:text-foreground">
                    Interview Guide
                  </button>
                  <button className="pb-2 text-muted-foreground hover:text-foreground">
                    Email Composer
                  </button>
                </div>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-6 py-6">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">CONTACT INFO</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCandidate.city || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCandidate.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCandidate.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>5 Years Exp.</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* AI Assistant Insight */}
                  <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="bg-primary rounded-full p-1">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">AI Assistant Insight</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedCandidate.summarize || "No AI summary available."}
                    </p>
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Match Score</span>
                        <Badge className="bg-primary text-primary-foreground">
                          {getVotePercentage(selectedCandidate.vote || "0")}% Match
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Skills Assessment */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">SKILL ASSESSMENT</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Technical</span>
                          <span className="font-medium">{getVotePercentage(selectedCandidate.vote || "0")}%</span>
                        </div>
                        <RoleMatchProgress percentage={getVotePercentage(selectedCandidate.vote || "0")} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Education */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">EDUCATION</h3>
                    <div className="text-sm whitespace-pre-wrap text-foreground">
                      {selectedCandidate.educational_details || "No education details available."}
                    </div>
                  </div>

                  <Separator />

                  {/* Experience */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">EXPERIENCE</h3>
                    <div className="text-sm whitespace-pre-wrap text-foreground">
                      {selectedCandidate.job_history || "No experience details available."}
                    </div>
                  </div>

                  <Separator />

                  {/* Skills */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">SKILLS</h3>
                    <div className="text-sm whitespace-pre-wrap text-foreground">
                      {selectedCandidate.skills || "No skills listed."}
                    </div>
                  </div>

                  <Separator />

                  {/* Recommendation */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">RECOMMENDATION</h3>
                    <div className="text-sm whitespace-pre-wrap text-foreground">
                      {selectedCandidate.consideration || "No recommendation available."}
                    </div>
                  </div>

                  {/* Download CV Button */}
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => window.open(selectedCandidate.cv_url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                    Download CV
                  </Button>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
