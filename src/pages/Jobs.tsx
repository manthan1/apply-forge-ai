
    import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/hooks/useAuth";
import {DashboardLayout} from "@/components/DashboardLayout";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";

interface JobListing {
    id: string;
    job_id: string;
    job_profile: string;
    company_name: string;
    status: string;
    created_at: string;
}

export default function Jobs () {
    const {user} = useAuth();
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingJobIds, setUpdatingJobIds] = useState<string[]>([]);

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

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
                <p className="text-muted-foreground">Jobs you've created and shared with candidates.</p>
            </div>

            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Openings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="font-semibold">ROLE</TableHead>
                                    <TableHead className="font-semibold">JOB ID</TableHead>
                                    <TableHead className="font-semibold">COMPANY</TableHead>
                                    <TableHead className="font-semibold">STATUS</TableHead>
                                    <TableHead className="font-semibold">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{job.job_profile}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{job.job_id}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{job.company_name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{job.status}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Link to={/dashboard?jobId=${encodeURIComponent(job.job_id)}}>
                                                    <Button size="sm">View Candidates</Button>
                                                </Link>
                                                <a href={/apply?id=${job.id}} target="_blank" rel="noreferrer">
                                                    <Button variant="outline" size="sm">Preview</Button>
                                                </a>
                                                <Button
                                                    size="sm"
                                                    variant={job.status === "Active" ? undefined : "outline"}
                                                    className={job.status === "Active" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                                                    onClick={async () => {
                                                        // prevent duplicate clicks
                                                        if(updatingJobIds.includes(job.id)) return;
                                                        setUpdatingJobIds((s) => [...s, job.id]);
                                                        try {
                                                            const newStatus = job.status === "Active" ? "Closed" : "Active";
                                                            const {error} = await (supabase as any)
                                                                .from("job_listings")
                                                                .update({status: newStatus})
                                                                .eq("id", job.id);
                                                            if(error) throw error;
                                                            toast.success(Job ${newStatus === "Active" ? "reopened" : "closed"} successfully);
                                                            await fetchJobs();
                                                        } catch(err: any) {
                                                            console.error("Error updating job status:", err);
                                                            toast.error(err?.message || "Failed to update job status");
                                                        } finally {
                                                            setUpdatingJobIds((s) => s.filter((id) => id !== job.id));
                                                        }
                                                    }}
                                                >
                                                    {updatingJobIds.includes(job.id) ? "Updating..." : job.status === "Active" ? "Close" : "Reopen"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {jobs.length === 0 && !loading && (
                            <div className="p-6 text-center text-sm text-muted-foreground">No jobs found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/hooks/useAuth";
import {DashboardLayout} from "@/components/DashboardLayout";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";

interface JobListing {
    id: string;
    job_id: string;
    job_profile: string;
    company_name: string;
    status: string;
    created_at: string;
}

export default function Jobs () {
    const {user} = useAuth();
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingJobIds, setUpdatingJobIds] = useState<string[]>([]);

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

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
                <p className="text-muted-foreground">Jobs you've created and shared with candidates.</p>
            </div>

            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Openings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="font-semibold">ROLE</TableHead>
                                    <TableHead className="font-semibold">JOB ID</TableHead>
                                    <TableHead className="font-semibold">COMPANY</TableHead>
                                    <TableHead className="font-semibold">STATUS</TableHead>
                                    <TableHead className="font-semibold">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{job.job_profile}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{job.job_id}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{job.company_name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{job.status}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Link to={/dashboard?jobId=${encodeURIComponent(job.job_id)}}>
                                                    <Button size="sm">View Candidates</Button>
                                                </Link>
                                                <a href={/apply?id=${job.id}} target="_blank" rel="noreferrer">
                                                    <Button variant="outline" size="sm">Preview</Button>
                                                </a>
                                                <Button
                                                    size="sm"
                                                    variant={job.status === "Active" ? undefined : "outline"}
                                                    className={job.status === "Active" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                                                    onClick={async () => {
                                                        // prevent duplicate clicks
                                                        if(updatingJobIds.includes(job.id)) return;
                                                        setUpdatingJobIds((s) => [...s, job.id]);
                                                        try {
                                                            const newStatus = job.status === "Active" ? "Closed" : "Active";
                                                            const {error} = await (supabase as any)
                                                                .from("job_listings")
                                                                .update({status: newStatus})
                                                                .eq("id", job.id);
                                                            if(error) throw error;
                                                            toast.success(Job ${newStatus === "Active" ? "reopened" : "closed"} successfully);
                                                            await fetchJobs();
                                                        } catch(err: any) {
                                                            console.error("Error updating job status:", err);
                                                            toast.error(err?.message || "Failed to update job status");
                                                        } finally {
                                                            setUpdatingJobIds((s) => s.filter((id) => id !== job.id));
                                                        }
                                                    }}
                                                >
                                                    {updatingJobIds.includes(job.id) ? "Updating..." : job.status === "Active" ? "Close" : "Reopen"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {jobs.length === 0 && !loading && (
                            <div className="p-6 text-center text-sm text-muted-foreground">No jobs found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}