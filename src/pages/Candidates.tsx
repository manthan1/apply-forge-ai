import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleMatchProgress } from "@/components/RoleMatchProgress";
import { CandidateRating } from "@/components/CandidateRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, ThumbsUp, ThumbsDown, MapPin, Mail, Phone, Download, Send, Filter, ArrowLeft, Scale, Loader2, TrendingUp, TrendingDown } from "lucide-react";

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
  status: string;
}

interface JobListing {
  id: string;
  job_id: string;
  job_profile: string;
  job_description: string;
  company_name: string;
  status: string;
  created_at: string;
}

interface CandidateWithJob extends AnalyzedResume {
  job_profile?: string;
  company_name?: string;
}

// Helper function to download file without being blocked by ad blockers
const downloadFile = (url: string, filename?: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (filename) {
    link.download = filename;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Candidates() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchJobId, setSearchJobId] = useState("");
  const [candidates, setCandidates] = useState<CandidateWithJob[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [allCandidatesLoaded, setAllCandidatesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithJob | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isJobSpecificView, setIsJobSpecificView] = useState(false);
  const [currentJobProfile, setCurrentJobProfile] = useState("");
  const [currentCompanyName, setCurrentCompanyName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchJobsAndCandidates();
    }
  }, [user?.id]);

  const fetchJobsAndCandidates = async () => {
    if (!user?.id) return;
    setLoading(true);
    
    try {
      // Fetch jobs first
      const { data: jobsData, error: jobsError } = await (supabase as any)
        .from("job_listings")
        .select("*")
        .eq("hr_user_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Get all job_ids for this user
      const jobIds = (jobsData || []).map((j: JobListing) => j.job_id);
      
      if (jobIds.length > 0) {
        // Fetch all candidates for these jobs
        const { data: candidatesData, error: candidatesError } = await (supabase as any)
          .from("ai_analysed_resume")
          .select("*")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

        if (candidatesError) throw candidatesError;

        // Fetch applicants to get cv_url
        const { data: applicantsData, error: applicantsError } = await (supabase as any)
          .from("applicants")
          .select("email, cv_url, job_id")
          .in("job_id", jobIds);

        if (applicantsError) throw applicantsError;

        // Map candidates with job info and cv_url from applicants
        const candidatesWithJob = (candidatesData || []).map((c: AnalyzedResume) => {
          const job = (jobsData || []).find((j: JobListing) => j.job_id === c.job_id);
          const applicant = (applicantsData || []).find((a: any) => a.email === c.email && a.job_id === c.job_id);
          return {
            ...c,
            cv_url: applicant?.cv_url || c.cv_url,
            job_profile: job?.job_profile || "Unknown Role",
            company_name: job?.company_name || "Unknown Company"
          };
        });

        setCandidates(candidatesWithJob);
        setAllCandidatesLoaded(true);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Handle jobId from URL query params
  useEffect(() => {
    const jobId = searchParams.get("jobId");
    if (jobId && jobs.length > 0) {
      handleViewJobCandidates(jobId);
    }
  }, [searchParams, jobs]);


  const handleSearch = async () => {
    if (!searchJobId.trim()) {
      toast.error("Please enter a Job ID");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("ai_analysed_resume")
        .select("*")
        .eq("job_id", searchJobId.trim());

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("No candidates found for this Job ID");
        setCandidates([]);
        return;
      }

      setCandidates(data);
      setIsJobSpecificView(false);
      toast.success(`Found ${data.length} candidate(s)`);
    } catch (error: any) {
      console.error("Error searching candidates:", error);
      toast.error("Failed to search candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleViewJobCandidates = async (jobId: string) => {
    setLoading(true);
    setIsJobSpecificView(true);
    setSelectedCandidates([]); // Clear selection when switching jobs
    
    try {
      const { data, error } = await (supabase as any)
        .from("ai_analysed_resume")
        .select("*")
        .eq("job_id", jobId);

      if (error) throw error;

      // Fetch applicants to get cv_url
      const { data: applicantsData, error: applicantsError } = await (supabase as any)
        .from("applicants")
        .select("email, cv_url, job_id")
        .eq("job_id", jobId);

      if (applicantsError) throw applicantsError;

      // Map candidates with cv_url from applicants
      const candidatesWithCv = (data || []).map((c: AnalyzedResume) => {
        const applicant = (applicantsData || []).find((a: any) => a.email === c.email && a.job_id === c.job_id);
        return {
          ...c,
          cv_url: applicant?.cv_url || c.cv_url
        };
      });

      setCandidates(candidatesWithCv);
      
      const job = jobs.find(j => j.job_id === jobId);
      if (job) {
        setCurrentJobProfile(job.job_profile);
        setCurrentCompanyName(job.company_name);
      }
    } catch (error: any) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllCandidates = () => {
    setCandidates([]);
    setIsJobSpecificView(false);
    setCurrentJobProfile("");
    setCurrentCompanyName("");
    setSearchJobId("");
    setSearchParams({});
    setSelectedCandidates([]);
  };

  const handleCompareCandidates = async () => {
    if (selectedCandidates.length < 2 || selectedCandidates.length > 10) {
      toast.error("Please select 2-10 candidates to compare");
      return;
    }

    setIsComparing(true);
    try {
      const selectedCandidateData = candidates.filter(c => selectedCandidates.includes(c.id));
      const job = jobs.find(j => j.job_id === candidates[0]?.job_id);

      const response = await fetch('https://n8n.srv898271.hstgr.cloud/webhook/compare_candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hr_user_id: user?.id,
          job_id: candidates[0]?.job_id,
          job_title: job?.job_profile || currentJobProfile,
          job_description: job?.job_description || "",
          candidates: selectedCandidateData.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            city: c.city,
            skills: c.skills,
            educational_details: c.educational_details,
            job_history: c.job_history,
            summarize: c.summarize,
            vote: c.vote,
            consideration: c.consideration,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to compare candidates');

      const data = await response.json();
      // Normalize rankings from different possible webhook response shapes (object or array)
      let rankings: any[] | null = null;

      if (Array.isArray(data)) {
        const content = data[0]?.message?.content;
        if (content) {
          if (typeof content === "string") {
            try {
              const parsed = JSON.parse(content);
              rankings = parsed.rankings || parsed;
            } catch (e) {
              console.error("Failed to parse string content from comparison webhook:", e);
            }
          } else {
            rankings = content.rankings || content;
          }
        }
      } else if (data?.message?.content) {
        const content = data.message.content;
        if (typeof content === "string") {
          try {
            const parsed = JSON.parse(content);
            rankings = parsed.rankings || parsed;
          } catch (e) {
            console.error("Failed to parse string content from comparison webhook (object):", e);
          }
        } else {
          rankings = content.rankings || content;
        }
      }

      if (!rankings || !Array.isArray(rankings)) {
        console.error("Unexpected comparison webhook response shape", data);
        toast.error("Received unexpected comparison data format from AI");
        return;
      }

      console.log("Comparison rankings:", rankings);
      setComparisonResults(rankings);
      setShowComparison(true);
      toast.success("Candidates compared successfully!");
    } catch (error: any) {
      console.error("Error comparing candidates:", error);
      toast.error("Failed to compare candidates");
    } finally {
      setIsComparing(false);
    }
  };

  const handleToggleCandidate = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    }
  };

  const handleShortlistAndSendEmails = async () => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate");
      return;
    }

    if (!isJobSpecificView) {
      toast.error("This action is only available when viewing job-specific candidates");
      return;
    }

    setIsSendingEmails(true);
    try {
      // Get selected candidate details
      const selectedCandidateData = candidates.filter(c => selectedCandidates.includes(c.id));
      
      // Get current job's candidates that are not selected and still in 'new' status
      const jobId = candidates[0]?.job_id;
      const nonSelectedNewCandidates = candidates.filter(
        c => !selectedCandidates.includes(c.id) && (!c.status || c.status === 'new')
      ).map(c => c.id);
      
      // Update selected candidates to 'shortlisted'
      const { error: shortlistError } = await supabase
        .from("ai_analysed_resume")
        .update({ status: 'shortlisted' })
        .in('id', selectedCandidates);

      if (shortlistError) throw shortlistError;

      // Update non-selected new candidates to 'rejected'
      if (nonSelectedNewCandidates.length > 0) {
        const { error: rejectError } = await supabase
          .from("ai_analysed_resume")
          .update({ status: 'rejected' })
          .in('id', nonSelectedNewCandidates);

        if (rejectError) throw rejectError;
      }

      // Send emails to webhook
      const emails = selectedCandidateData.map(c => c.email);
      const response = await fetch('https://n8n.srv898271.hstgr.cloud/webhook/selected_candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails,
          job_profile: currentJobProfile,
          company_name: currentCompanyName
        }),
      });

      if (!response.ok) throw new Error('Failed to send emails');

      toast.success(
        `Successfully shortlisted ${selectedCandidates.length} candidate(s)${
          nonSelectedNewCandidates.length > 0 
            ? ` and marked ${nonSelectedNewCandidates.length} as rejected` 
            : ''
        }`
      );
      
      // Refresh candidates to show updated status
      if (jobId) {
        await handleViewJobCandidates(jobId);
      }
      
      setSelectedCandidates([]);
    } catch (error: any) {
      console.error("Error shortlisting candidates:", error);
      toast.error("Failed to shortlist candidates and send emails");
    } finally {
      setIsSendingEmails(false);
    }
  };

  const getFilteredCandidates = () => {
    if (statusFilter === "all") return candidates;
    if (statusFilter === "new") return candidates.filter(c => !c.status || c.status === "new");
    if (statusFilter === "shortlisted") return candidates.filter(c => c.status === "shortlisted");
    if (statusFilter === "rejected") return candidates.filter(c => c.status === "rejected");
    if (statusFilter === "interviewed") return candidates.filter(c => c.status === "interviewed");
    return candidates;
  };

  const filteredCandidates = getFilteredCandidates();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isJobSpecificView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAllCandidates}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to All Jobs
              </Button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {isJobSpecificView ? `Candidates for ${currentJobProfile}` : "All Candidates"}
          </h1>
          <p className="text-muted-foreground">
            {isJobSpecificView 
              ? `${currentCompanyName} • ${filteredCandidates.length} candidate(s)`
              : "View and manage candidates across all job openings"}
          </p>
        </div>

        {/* Search Bar */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Job ID..."
                  value={searchJobId}
                  onChange={(e) => setSearchJobId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 border-border/50"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
              {candidates.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleViewAllCandidates}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Candidates by Job */}
        {!isJobSpecificView && candidates.length === 0 && (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg text-foreground">{job.job_profile}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{job.company_name}</span>
                        <span>•</span>
                        <span>Job ID: {job.job_id}</span>
                        <Badge variant={job.status === "Active" ? "default" : "secondary"}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleViewJobCandidates(job.job_id)}
                      variant="outline"
                    >
                      View Candidates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Candidates Table */}
        {candidates.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle>Candidates</CardTitle>
                <div className="flex items-center gap-3">
                  <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="new">New</TabsTrigger>
                      <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {selectedCandidates.length > 0 && (
                    <div className="flex items-center gap-2">
                      {isJobSpecificView && (
                        <Button
                          onClick={handleShortlistAndSendEmails}
                          disabled={isSendingEmails}
                          className="gap-2"
                          size="sm"
                        >
                          <Send className="h-4 w-4" />
                          Shortlist & Send Emails ({selectedCandidates.length})
                        </Button>
                      )}
                      <Button
                        onClick={handleCompareCandidates}
                        disabled={isComparing || selectedCandidates.length < 2 || selectedCandidates.length > 10}
                        variant="outline"
                        className="gap-2"
                        size="sm"
                      >
                        {isComparing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Comparing...
                          </>
                        ) : (
                          <>
                            <Scale className="h-4 w-4" />
                            Compare ({selectedCandidates.length})
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">CANDIDATE</TableHead>
                      {!isJobSpecificView && <TableHead className="font-semibold hidden md:table-cell">APPLIED FOR</TableHead>}
                      <TableHead className="font-semibold hidden sm:table-cell">CONTACT</TableHead>
                      <TableHead className="font-semibold">AI RATING</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">ROLE MATCH</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">STATUS</TableHead>
                      <TableHead className="font-semibold">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id} className="hover:bg-muted/20">
                        <TableCell>
                          <Checkbox
                            checked={selectedCandidates.includes(candidate.id)}
                            onCheckedChange={() => handleToggleCandidate(candidate.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                                {candidate.name?.substring(0, 2).toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground text-sm sm:text-base truncate">{candidate.name || "Unknown"}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{candidate.city || "N/A"}</span>
                              </div>
                              {/* Show job role on mobile when not in job-specific view */}
                              {!isJobSpecificView && (
                                <div className="text-xs text-primary font-medium mt-0.5 md:hidden truncate">
                                  {candidate.job_profile}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {!isJobSpecificView && (
                          <TableCell className="hidden md:table-cell">
                            <div className="space-y-1">
                              <div className="font-medium text-foreground text-sm">{candidate.job_profile}</div>
                              <div className="text-xs text-muted-foreground">{candidate.company_name}</div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground truncate max-w-[120px] lg:max-w-none">{candidate.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">{candidate.phone || "N/A"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <span className="text-base sm:text-lg font-semibold text-foreground">{candidate.vote || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <RoleMatchProgress percentage={(parseFloat(candidate.vote) || 0) * 10} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <StatusBadge status={candidate.status || "new"} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCandidate(candidate)}
                              className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <span className="hidden sm:inline">View Details</span>
                              <span className="sm:hidden">View</span>
                            </Button>
                            {candidate.cv_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadFile(candidate.cv_url, `${candidate.name || 'resume'}.pdf`)}
                                className="px-2"
                                title="Download Resume"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && candidates.length === 0 && jobs.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No jobs found. Create your first job to start receiving applications.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comparison Results Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    Candidate Comparison
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    AI-powered analysis of {comparisonResults?.length || 0} selected candidates
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          {comparisonResults && Array.isArray(comparisonResults) && comparisonResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {comparisonResults.map((result: any, index: number) => {
                const originalCandidate = candidates.find(c => c.id === result.id);
                const isTopRank = result.rank === 1;
                const isNotRecommended = result.recommendation?.toLowerCase().includes('not');
                
                return (
                  <Card 
                    key={index} 
                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                      isTopRank ? 'ring-2 ring-primary/50 shadow-lg' : 'hover:ring-1 hover:ring-border'
                    }`}
                  >
                    {/* Top Rank Badge */}
                    {isTopRank && (
                      <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-3 py-1 rounded-bl-lg text-xs font-semibold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Top Match
                      </div>
                    )}

                    <CardHeader className="space-y-4 pb-4">
                      {/* Header with Rank and Score */}
                      <div className="flex items-start justify-between">
                        <Badge 
                          variant={isTopRank ? "default" : "secondary"}
                          className="text-sm px-3 py-1 font-semibold"
                        >
                          Rank #{result.rank}
                        </Badge>
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-primary">{result.overall_score}</span>
                            <span className="text-sm text-muted-foreground font-medium">/10</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Overall Score</span>
                        </div>
                      </div>

                      {/* Candidate Info */}
                      <div className="flex items-center gap-3 pt-2">
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-base font-bold">
                            {(result.name || originalCandidate?.name || "??").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-foreground truncate">
                            {result.name || originalCandidate?.name || "Unknown"}
                          </h3>
                          {originalCandidate?.email && (
                            <p className="text-xs text-muted-foreground truncate">{originalCandidate.email}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="space-y-4 pt-4">
                      {/* Match Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-primary"></div>
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Match Analysis
                          </h4>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed pl-3 border-l-2 border-border">
                          {result.match_summary || "No analysis available"}
                        </p>
                      </div>

                      {/* Strengths */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-success" />
                          <h4 className="text-xs font-bold text-success uppercase tracking-wider">
                            Key Strengths
                          </h4>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          {result.strengths?.length > 0 ? (
                            result.strengths.map((strength: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 group">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success flex-shrink-0"></div>
                                <p className="text-sm text-foreground leading-relaxed">{strength}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No strengths listed</p>
                          )}
                        </div>
                      </div>

                      {/* Weaknesses */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-destructive" />
                          <h4 className="text-xs font-bold text-destructive uppercase tracking-wider">
                            Areas for Improvement
                          </h4>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          {result.weaknesses?.length > 0 ? (
                            result.weaknesses.map((weakness: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 group">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0"></div>
                                <p className="text-sm text-foreground leading-relaxed">{weakness}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No weaknesses listed</p>
                          )}
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="pt-3 space-y-2">
                        <Separator />
                        <div className="space-y-2 pt-2">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Recommendation
                          </h4>
                          <div className={`p-3 rounded-lg text-sm leading-relaxed ${
                            isNotRecommended 
                              ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                              : isTopRank
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-muted/50 text-foreground border border-border'
                          }`}>
                            {result.recommendation || "Pending detailed review"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No comparison data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-4 sm:p-6">
          {selectedCandidate && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-lg">
                      {selectedCandidate.name?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg sm:text-xl truncate">{selectedCandidate.name || "Unknown Candidate"}</div>
                    <SheetDescription className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{selectedCandidate.city || "Location not specified"}</span>
                    </SheetDescription>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                {/* Applied For - Job Role */}
                <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Applied For</p>
                  <p className="font-semibold text-foreground text-sm sm:text-base">{selectedCandidate.job_profile || "Unknown Role"}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedCandidate.company_name || ""}</p>
                </div>

                {/* Status and Match */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Application Status</p>
                    <StatusBadge status={selectedCandidate.status || "new"} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">AI Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-foreground">{selectedCandidate.vote || "N/A"}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Role Match</p>
                    <RoleMatchProgress percentage={(parseFloat(selectedCandidate.vote) || 0) * 10} />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-3 sm:p-4 bg-muted/20 rounded-lg">
                  <h3 className="font-semibold mb-3 text-foreground text-sm sm:text-base">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground break-all">{selectedCandidate.email || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{selectedCandidate.phone || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{selectedCandidate.city || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* AI Summary */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground text-sm sm:text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    AI Summary
                  </h3>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {selectedCandidate.summarize || "No summary available"}
                    </p>
                  </div>
                </div>

                {/* AI Consideration */}
                {selectedCandidate.consideration && (
                  <div>
                    <h3 className="font-semibold mb-3 text-foreground text-sm sm:text-base flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success"></div>
                      AI Recommendation
                    </h3>
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        {selectedCandidate.consideration}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Skills */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground text-sm sm:text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    Skills
                  </h3>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <ScrollArea className="max-h-24">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedCandidate.skills || "No skills listed"}
                      </p>
                    </ScrollArea>
                  </div>
                </div>

                <Separator />

                {/* Education */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground text-sm sm:text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    Education
                  </h3>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <ScrollArea className="max-h-24">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedCandidate.educational_details || "No education details provided"}
                      </p>
                    </ScrollArea>
                  </div>
                </div>

                <Separator />

                {/* Work Experience */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground text-sm sm:text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    Work Experience
                  </h3>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <ScrollArea className="max-h-32">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedCandidate.job_history || "No work history provided"}
                      </p>
                    </ScrollArea>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                  <Button className="flex-1 gap-2 text-sm" onClick={() => window.location.href = `mailto:${selectedCandidate.email}`}>
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                  {selectedCandidate.cv_url && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 text-sm"
                      onClick={() => window.open(selectedCandidate.cv_url, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                      Download CV
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
