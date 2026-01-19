export type ReportJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
export type ReportJobType = 'ELECTIONS_CSV';

export type ReportJob = {
  id: string;
  type: ReportJobType;
  status: ReportJobStatus;
  params: Record<string, unknown> | null;
  s3Bucket: string | null;
  s3Key: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
};

export type ReportJobMessage = {
  jobId: string;
};
