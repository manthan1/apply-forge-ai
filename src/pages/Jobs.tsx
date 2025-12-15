import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/hooks/useAuth";
import {DashboardLayout} from "@/components/DashboardLayout";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {ScrollArea} from "@/components/ui/scroll-area";
import {toast} from "sonner";
import {Download, Users, FileText} from "lucide-react";

interface JobListing {
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
    cv_url: string;
    job_id: string;
}

export default function Jobs () {
    const {user} = useAuth();
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingJobIds, setUpdatingJobIds] = useState<string[]>([]);
    const [selectedJobForResumes, setSelectedJobForResumes] = useState<JobListing | null>(null);
    const [jobCandidates, setJobCandidates] = useState<Candidate[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);

    useEffect(() => {
        if(user?.id) {
            fetchJobs();
        }
    }, [user?.id]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const {data, error} = await (supabase as any)
                .from("job_listings")
                .select("*")
                .eq("hr_user_id", user.id)
                .order("created_at", {ascending: false});

            if(error) throw error;
            setJobs(data || []);
        } catch(error: any) {
            console.error("Error fetching jobs:", error);
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const fetchJobCandidates = async (job: JobListing) => {
        setSelectedJobForResumes(job);
        setLoadingCandidates(true);
        try {
            const {data, error} = await (supabase as any)
                .from("ai_analysed_resume")
                .select("id, name, email, cv_url, job_id")
                .eq("job_id", job.job_id);

            if(error) throw error;
            setJobCandidates(data || []);
        } catch(error: any) {
            console.error("Error fetching candidates:", error);
            toast.error("Failed to load candidates");
        } finally {
            setLoadingCandidates(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-6 sm:mb-10 space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">Jobs</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Jobs you've created and shared with candidates.</p>
            </div>

            <Card className="p-4 sm:p-8">
                <CardHeader className="pb-4 sm:pb-6 px-0 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl">Openings</CardTitle>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                    <div className="rounded-xl sm:rounded-2xl border border-border/30 overflow-hidden card-shadow">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20 hover:bg-muted/30">
                                        <TableHead className="font-semibold text-xs sm:text-sm">ROLE</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">JOB ID</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">COMPANY</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm">STATUS</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm">ACTIONS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs.map((job) => (
                                        <TableRow key={job.id} className="smooth-transition hover:bg-muted/10">
                                            <TableCell className="py-3 sm:py-5">
                                                <div className="font-semibold text-foreground text-sm sm:text-base">{job.job_profile}</div>
                                                <div className="text-xs text-muted-foreground sm:hidden mt-1">{job.job_id}</div>
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm text-muted-foreground py-3 sm:py-5 hidden sm:table-cell">{job.job_id}</TableCell>
                                            <TableCell className="text-xs sm:text-sm text-muted-foreground py-3 sm:py-5 hidden md:table-cell">{job.company_name}</TableCell>
                                            <TableCell className="py-3 sm:py-5">
                                                <Badge variant={job.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                                                    {job.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 sm:py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    <Link to={`/candidates?jobId=${encodeURIComponent(job.job_id)}`}>
                                                        <Button size="sm" className="rounded-xl text-xs sm:text-sm gap-1">
                                                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            <span className="hidden sm:inline">View Candidates</span>
                                                            <span className="sm:hidden">Candidates</span>
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="rounded-xl text-xs sm:text-sm gap-1"
                                                        onClick={() => fetchJobCandidates(job)}
                                                    >
                                                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        <span className="hidden sm:inline">Download CVs</span>
                                                        <span className="sm:hidden">CVs</span>
                                                    </Button>
                                                    <a href={`/apply?id=${job.id}`} target="_blank" rel="noreferrer" className="hidden lg:inline-block">
                                                        <Button variant="outline" size="sm" className="text-xs sm:text-sm">Preview</Button>
                                                    </a>
                                                    <Button
                                                        size="sm"
                                                        variant={job.status === "Active" ? "destructive" : "outline"}
                                                        className="text-xs sm:text-sm"
                                                        onClick={async () => {
                                                            if(updatingJobIds.includes(job.id)) return;
                                                            setUpdatingJobIds((s) => [...s, job.id]);
                                                            try {
                                                                const newStatus = job.status === "Active" ? "Closed" : "Active";
                                                                const {error} = await (supabase as any)
                                                                    .from("job_listings")
                                                                    .update({status: newStatus})
                                                                    .eq("id", job.id);
                                                                if(error) throw error;
                                                                toast.success(`Job ${newStatus === "Active" ? "reopened" : "closed"} successfully`);
                                                                await fetchJobs();
                                                            } catch(err: any) {
                                                                console.error("Error updating job status:", err);
                                                                toast.error(err?.message || "Failed to update job status");
                                                            } finally {
                                                                setUpdatingJobIds((s) => s.filter((id) => id !== job.id));
                                                            }
                                                        }}
                                                    >
                                                        {updatingJobIds.includes(job.id) ? "..." : job.status === "Active" ? "Close" : "Reopen"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {jobs.length === 0 && !loading && (
                            <div className="p-6 text-center text-sm text-muted-foreground">No jobs found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Download CVs Dialog */}
            <Dialog open={!!selectedJobForResumes} onOpenChange={() => setSelectedJobForResumes(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Download Resumes - {selectedJobForResumes?.job_profile}
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px] mt-4">
                        {loadingCandidates ? (
                            <div className="text-center py-8 text-muted-foreground">Loading candidates...</div>
                        ) : jobCandidates.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No candidates found for this job.</div>
                        ) : (
                            <div className="space-y-2">
                                {jobCandidates.map((candidate) => (
                                    <div key={candidate.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-foreground text-sm truncate">{candidate.name || "Unknown"}</p>
                                            <p className="text-xs text-muted-foreground truncate">{candidate.email || "No email"}</p>
                                        </div>
                                        {candidate.cv_url ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1 ml-2 flex-shrink-0"
                                                onClick={() => window.open(candidate.cv_url, "_blank")}
                                            >
                                                <Download className="h-3 w-3" />
                                                <span className="hidden sm:inline">Download</span>
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground ml-2">No CV</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}