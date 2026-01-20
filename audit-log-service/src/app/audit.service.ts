import { Injectable } from '@nestjs/common';
import type { AuditLogDto, AuditLogQuery, CreateAuditLogRequestDto } from '@org/contracts';
import { query } from './db/postgres';

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: Date | string;
};

@Injectable()
export class AuditService {
  async create(entry: CreateAuditLogRequestDto & { ip?: string | null; userAgent?: string | null }): Promise<AuditLogDto> {
    const rows = await query<AuditRow>(
      `INSERT INTO audit_logs (actor_id, actor_role, action, resource, resource_id, metadata, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        entry.actorId ?? null,
        entry.actorRole ?? null,
        entry.action,
        entry.resource,
        entry.resourceId ?? null,
        entry.metadata ?? null,
        entry.ip ?? null,
        entry.userAgent ?? null,
      ],
    );

    return this.mapRow(rows[0]);
  }

  async list(filters: AuditLogQuery): Promise<AuditLogDto[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (filters.actorId) {
      values.push(filters.actorId);
      clauses.push(`actor_id = $${values.length}`);
    }
    if (filters.actorRole) {
      values.push(filters.actorRole);
      clauses.push(`actor_role = $${values.length}`);
    }
    if (filters.action) {
      values.push(filters.action);
      clauses.push(`action = $${values.length}`);
    }
    if (filters.resource) {
      values.push(filters.resource);
      clauses.push(`resource = $${values.length}`);
    }
    if (filters.electionId) {
      values.push(filters.electionId);
      clauses.push(`metadata->>'electionId' = $${values.length}`);
    }
    if (filters.from) {
      values.push(filters.from);
      clauses.push(`created_at >= $${values.length}::timestamptz`);
    }
    if (filters.to) {
      values.push(filters.to);
      clauses.push(`created_at <= $${values.length}::timestamptz`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Math.min(Number(filters.limit ?? 50), 1000);
    values.push(limit);

    const rows = await query<AuditRow>(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${values.length}`,
      values,
    );

    return rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: AuditRow | undefined): AuditLogDto {
    if (!row) {
      return {
        id: '',
        action: '',
        resource: '',
        createdAt: new Date().toISOString(),
      };
    }
    return {
      id: row.id,
      actorId: row.actor_id ?? null,
      actorRole: row.actor_role as any,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id ?? null,
      metadata: row.metadata ?? null,
      ip: row.ip ?? null,
      userAgent: row.user_agent ?? null,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    };
  }
}
