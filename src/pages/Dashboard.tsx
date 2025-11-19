import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Users, Briefcase, TrendingUp, Activity, Clock } from "lucide-react";

interface JobListing {
  id: string;
  job_id: string;
  job_profile: string;
  company_name: string;
  status: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [applicantCount, setApplicantCount] = useState<Record<string, number>>({});
  const [totalCandidatesCount, setTotalCandidatesCount] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await (supabase as any)
        .from("job_listings")
        .select("*")
        .eq("hr_user_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);
      
      // Fetch all candidates for this HR
      if (jobsData && jobsData.length > 0) {
        const jobIds = jobsData.map((job: any) => job.job_id);
        
        const { data: candidatesData, error: candidatesError } = await (supabase as any)
          .from("ai_analysed_resume")
          .select("*")
          .in("job_id", jobIds);
        
        if (!candidatesError && candidatesData) {
          // Count applicants per job
          const counts: Record<string, number> = {};
          candidatesData.forEach((app: any) => {
            counts[app.job_id] = (counts[app.job_id] || 0) + 1;
          });
          setApplicantCount(counts);
          
          // Total candidates
          setTotalCandidatesCount(candidatesData.length);
          
          // Shortlisted count
          const shortlisted = candidatesData.filter((c: any) => c.vote === "yes").length;
          setShortlistedCount(shortlisted);
          
          // Generate activity logs
          const logs: ActivityLog[] = candidatesData
            .slice(0, 10)
            .map((candidate: any, idx: number) => ({
              id: `${idx}`,
              action: "New Application",
              details: `${candidate.name} applied for ${jobsData.find((j: any) => j.job_id === candidate.job_id)?.job_profile || "Unknown Position"}`,
              timestamp: new Date(candidate.created_at).toLocaleString()
            }));
          setActivityLogs(logs);
        }
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const activeJobs = jobs.filter(job => job.status === "Active").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your recruitment overview.</p>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Candidates"
            value={totalCandidatesCount}
            icon={Users}
            iconColor="text-blue-500"
            trend="+12%"
          />
          <MetricCard
            title="Active Jobs"
            value={activeJobs}
            icon={Briefcase}
            iconColor="text-green-500"
            trend="+2"
          />
          <MetricCard
            title="Shortlisted"
            value={shortlistedCount}
            icon={TrendingUp}
            iconColor="text-orange-500"
            trend="+8%"
          />
          <MetricCard
            title="Pending Review"
            value={totalCandidatesCount - shortlistedCount}
            icon={Clock}
            iconColor="text-purple-500"
            trend="0"
          />
        </div>

        {/* Active Jobs Overview */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Active Job Openings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">JOB TITLE</TableHead>
                    <TableHead className="font-semibold">COMPANY</TableHead>
                    <TableHead className="font-semibold">APPLICANTS</TableHead>
                    <TableHead className="font-semibold">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.slice(0, 5).map((job) => (
                    <TableRow key={job.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-medium text-foreground">{job.job_profile}</div>
                        <div className="text-sm text-muted-foreground">ID: {job.job_id}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{job.company_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {applicantCount[job.job_id] || 0} applicants
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.status === "Active" ? "default" : "secondary"}>
                          {job.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No jobs created yet. Create your first job to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">{log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                {activityLogs.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No recent activity. Start by creating a job and receiving applications.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
