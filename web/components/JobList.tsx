"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiClient, Job } from "@/lib/api";
import { AudioPlayer } from "./AudioPlayer";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

interface JobListProps {
  jobIds: number[];
}

export function JobList({ jobIds }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchJobs = async () => {
      try {
        const jobPromises = jobIds.map((id) => apiClient.getJob(id));
        const jobData = await Promise.all(jobPromises);
        setJobs(jobData);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobIds]);

  if (loading) {
    return <div>Loading jobs...</div>;
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No jobs yet. Create a track to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Job #{job.id}</CardTitle>
              {job.status === "complete" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {job.status === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
              {(job.status === "queued" || job.status === "processing") && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              )}
            </div>
            <CardDescription>
              Track ID: {job.track_id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">{job.status}</span>
                <span>{Math.round(job.progress * 100)}%</span>
              </div>
              <Progress value={job.progress * 100} />
            </div>

            {job.error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {job.error}
              </div>
            )}

            {job.status === "complete" && job.track_id && (
              <div className="text-sm text-muted-foreground">
                Track {job.track_id} completed. Preview available in library.
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

