import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Calendar, User, Phone, MapPin, Mail, FileText, Download, Briefcase, Lock, Unlock } from "lucide-react";

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
  const { user } = useAuth();
  const [searchJobId, setSearchJobId] = useState("");
  const [candidates, setCandidates] = useState<AnalyzedResume[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .eq("hr_user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load job listings");
    }
  };

  const handleSearch = async () => {
    if (!searchJobId.trim()) {
      toast.error("Please enter a Job ID");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_analysed_resume")
        .select("*")
        .eq("job_id", searchJobId.trim())
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.info("No candidates have applied yet for this job.");
      }
      
      setCandidates(data || []);
    } catch (error: any) {
      console.error("Error searching candidates:", error);
      toast.error("Failed to search candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = async () => {
    setLoading(true);
    try {
      const jobIds = jobs.map(job => job.job_id);
      
      const { data, error } = await supabase
        .from("ai_analysed_resume")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.info("No candidates have applied yet.");
      }
      
      setCandidates(data || []);
      setSearchJobId("");
    } catch (error: any) {
      console.error("Error fetching all candidates:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Closed" : "Active";
    
    try {
      const { error } = await supabase
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Candidate Dashboard</CardTitle>
            <CardDescription>
              Search and manage job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <Input
                  placeholder="Enter Job ID (e.g., ACME-0001)"
                  value={searchJobId}
                  onChange={(e) => setSearchJobId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                Search Candidates
              </Button>
              <Button onClick={handleViewAll} variant="outline" disabled={loading}>
                View All Candidates
              </Button>
            </div>
          </CardContent>
        </Card>

        {candidates.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Applications ({candidates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Education</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Recommendation</TableHead>
                      <TableHead>Job ID</TableHead>
                      <TableHead>CV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(candidate.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {candidate.name || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {candidate.phone || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {candidate.city || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {candidate.email || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm" title={candidate.educational_details}>
                            {candidate.educational_details || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm" title={candidate.job_history}>
                            {candidate.job_history || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm" title={candidate.skills}>
                            {candidate.skills || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm" title={candidate.summarize}>
                            {candidate.summarize || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={candidate.vote ? "default" : "secondary"}>
                            {candidate.vote || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm" title={candidate.consideration}>
                            {candidate.consideration || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline">{candidate.job_id}</Badge>
                        </TableCell>
                        <TableCell>
                          {candidate.cv_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              asChild
                            >
                              <a
                                href={candidate.cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              My Job Listings
            </CardTitle>
            <CardDescription>
              Manage your posted job positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No job listings yet. Create your first job form to get started!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.job_profile}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.job_id}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.status === "Active" ? "default" : "secondary"}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(job.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={job.status === "Active" ? "destructive" : "default"}
                            onClick={() => toggleJobStatus(job.id, job.status)}
                          >
                            {job.status === "Active" ? (
                              <>
                                <Lock className="h-4 w-4 mr-1" />
                                Close
                              </>
                            ) : (
                              <>
                                <Unlock className="h-4 w-4 mr-1" />
                                Reopen
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
