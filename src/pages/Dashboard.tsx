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

interface ShortlistedCandidate {
  id: string;
  name: string;
  email: string;
  job_id: string;
  vote: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [applicantCount, setApplicantCount] = useState<Record<string, number>>({});
  const [totalCandidatesCount, setTotalCandidatesCount] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [shortlistedCandidates, setShortlistedCandidates] = useState<ShortlistedCandidate[]>([]);

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
          
          // Shortlisted count and candidates
          const shortlisted = candidatesData.filter((c: any) => c.status === "shortlisted");
          setShortlistedCount(shortlisted.length);
          setShortlistedCandidates(shortlisted);
          
          // Generate activity logs (sorted by newest first)
          const logs: ActivityLog[] = candidatesData
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
      {/* Header with Gradient */}
      <div className="mb-8 rounded-3xl gradient-primary p-8 text-white shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.email?.split("@")[0] || "HR Manager"}</h1>
        <p className="text-white/90 text-base">Here's your recruitment overview</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Total Candidates"
          value={totalCandidatesCount}
          icon={Users}
          iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Active Jobs"
          value={activeJobs}
          icon={Briefcase}
          iconColor="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <MetricCard
          title="Shortlisted"
          value={shortlistedCount}
          icon={TrendingUp}
          iconColor="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Pending Review"
          value={totalCandidatesCount - shortlistedCount}
          icon={Clock}
          iconColor="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Grid Layout for Jobs and Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Job Openings - 2 columns */}
        <Card className="lg:col-span-2 glass-effect border-0 card-shadow-lg">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xl font-bold">Active Job Openings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No active job listings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.filter(job => job.status === "Active").slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 smooth-transition border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{job.job_profile}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{job.company_name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{applicantCount[job.job_id] || 0}</p>
                          <p className="text-xs text-muted-foreground">Applicants</p>
                        </div>
                        <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-effect border-0 card-shadow-lg">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[400px] pr-4">
              {activityLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 items-start group">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 ring-4 ring-primary/20 group-hover:ring-primary/40 smooth-transition"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{log.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
