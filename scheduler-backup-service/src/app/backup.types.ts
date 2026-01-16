export type BackupArtifact = {
  name: string;
  path: string;
};

export type BackupResult = {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  artifacts: BackupArtifact[];
  message?: string;
};

