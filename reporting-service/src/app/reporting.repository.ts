import { Injectable } from '@nestjs/common';
import { query } from './db/postgres';
import type { ReportJob, ReportJobStatus, ReportJobType } from './reporting.types';

type ReportJobRow = {
  id: string;
  type: ReportJobType;
  status: ReportJobStatus;
  params: Record<string, unknown> | null;
  s3_bucket: string | null;
  s3_key: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  started_at: Date | string | null;
  finished_at: Date | string | null;
  error: string | null;
};

@Injectable()
export class ReportingRepository {
  async createJob(id: string, type: ReportJobType, params: Record<string, unknown>): Promise<ReportJob> {
    const rows = await query<ReportJobRow>(
      `INSERT INTO report_jobs (id, type, status, params)
       VALUES ($1, $2, 'PENDING', $3)
       RETURNING *`,
      [id, type, params],
    );
    return this.mapRow(rows[0]);
  }

  async getJob(id: string): Promise<ReportJob | null> {
    const rows = await query<ReportJobRow>('SELECT * FROM report_jobs WHERE id = $1', [id]);
    const row = rows[0];
    return row ? this.mapRow(row) : null;
  }

  async markRunning(id: string): Promise<void> {
    await query(
      `UPDATE report_jobs
       SET status = 'RUNNING', started_at = now(), updated_at = now()
       WHERE id = $1`,
      [id],
    );
  }

  async markDone(id: string, s3Bucket: string, s3Key: string): Promise<void> {
    await query(
      `UPDATE report_jobs
       SET status = 'DONE',
           s3_bucket = $2,
           s3_key = $3,
           finished_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [id, s3Bucket, s3Key],
    );
  }

  async markFailed(id: string, error: string): Promise<void> {
    await query(
      `UPDATE report_jobs
       SET status = 'FAILED', error = $2, finished_at = now(), updated_at = now()
       WHERE id = $1`,
      [id, error],
    );
  }

  private mapRow(row: ReportJobRow): ReportJob {
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      params: row.params ?? null,
      s3Bucket: row.s3_bucket,
      s3Key: row.s3_key,
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
      startedAt: row.started_at ? this.toIso(row.started_at) : null,
      finishedAt: row.finished_at ? this.toIso(row.finished_at) : null,
      error: row.error,
    };
  }

  private toIso(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
