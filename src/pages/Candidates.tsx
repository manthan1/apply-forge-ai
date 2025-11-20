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
import { Search, ThumbsUp, ThumbsDown, MapPin, Mail, Phone, Download, Send, Filter, ArrowLeft } from "lucide-react";

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
  company_name: string;
  status: string;
  created_at: string;
}

export default function Candidates() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchJobId, setSearchJobId] = useState("");
  const [candidates, setCandidates] = useState<AnalyzedResume[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<AnalyzedResume | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isJobSpecificView, setIsJobSpecificView] = useState(false);
  const [currentJobProfile, setCurrentJobProfile] = useState("");
  const [currentCompanyName, setCurrentCompanyName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
    }
  }, [user?.id]);

  // Handle jobId from URL query params
  useEffect(() => {
    const jobId = searchParams.get("jobId");
    if (jobId && jobs.length > 0) {
      handleViewJobCandidates(jobId);
    }
  }, [searchParams, jobs]);

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
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    }
  };

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

      setCandidates(data || []);
      
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
      
      // Update status to 'shortlisted' in database
      const { error: updateError } = await (supabase as any)
        .from("ai_analysed_resume")
        .update({ status: 'shortlisted' })
        .in('id', selectedCandidates);

      if (updateError) throw updateError;

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

      toast.success(`Successfully shortlisted ${selectedCandidates.length} candidate(s) and sent emails`);
      
      // Refresh candidates to show updated status
      if (isJobSpecificView) {
        const jobId = candidates[0]?.job_id;
        if (jobId) {
          await handleViewJobCandidates(jobId);
        }
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
    if (statusFilter === "new") return candidates.filter(c => c.status === "new");
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
                      <TabsTrigger value="rejected">Rejected</TabsTrigger>
                      <TabsTrigger value="interviewed">Interviewed</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {isJobSpecificView && selectedCandidates.length > 0 && (
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {isJobSpecificView && (
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead className="font-semibold">CANDIDATE</TableHead>
                      <TableHead className="font-semibold">CONTACT</TableHead>
                      <TableHead className="font-semibold">AI RATING</TableHead>
                      <TableHead className="font-semibold">ROLE MATCH</TableHead>
                      <TableHead className="font-semibold">STATUS</TableHead>
                      <TableHead className="font-semibold">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id} className="hover:bg-muted/20">
                        {isJobSpecificView && (
                          <TableCell>
                            <Checkbox
                              checked={selectedCandidates.includes(candidate.id)}
                              onCheckedChange={() => handleToggleCandidate(candidate.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {candidate.name?.substring(0, 2).toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{candidate.name || "Unknown"}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {candidate.city || "N/A"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{candidate.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{candidate.phone || "N/A"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <span className="text-lg font-semibold text-foreground">{candidate.vote || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleMatchProgress percentage={(parseFloat(candidate.vote) || 0) * 10} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={candidate.status || "new"} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCandidate(candidate)}
                            >
                              View Details
                            </Button>
                            {candidate.cv_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(candidate.cv_url, "_blank")}
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

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedCandidate && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedCandidate.name?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{selectedCandidate.name || "Unknown Candidate"}</div>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3" />
                      {selectedCandidate.city || "Location not specified"}
                    </SheetDescription>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status and Match */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Application Status</p>
                    <StatusBadge status={selectedCandidate.vote === "yes" ? "shortlisted" : selectedCandidate.vote === "no" ? "rejected" : "new"} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">AI Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">{selectedCandidate.vote || "N/A"}</span>
                      <span className="text-sm text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Role Match</p>
                    <RoleMatchProgress percentage={(parseFloat(selectedCandidate.vote) || 0) * 10} />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedCandidate.email || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedCandidate.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* AI Summary */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">AI Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedCandidate.summarize || "No summary available"}
                  </p>
                </div>

                <Separator />

                {/* Skills */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Skills</h3>
                  <ScrollArea className="h-24">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedCandidate.skills || "No skills listed"}
                    </p>
                  </ScrollArea>
                </div>

                <Separator />

                {/* Education */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Education</h3>
                  <ScrollArea className="h-24">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedCandidate.educational_details || "No education details provided"}
                    </p>
                  </ScrollArea>
                </div>

                <Separator />

                {/* Work Experience */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Work Experience</h3>
                  <ScrollArea className="h-32">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedCandidate.job_history || "No work history provided"}
                    </p>
                  </ScrollArea>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 gap-2" onClick={() => window.location.href = `mailto:${selectedCandidate.email}`}>
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                  {selectedCandidate.cv_url && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
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
