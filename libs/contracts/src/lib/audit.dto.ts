import { IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export type AuditActorRole = 'admin' | 'voter' | 'system';

export interface AuditLogDto {
  id: string;
  actorId?: string | null;
  actorRole?: AuditActorRole | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export class CreateAuditLogRequestDto {
  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsIn(['admin', 'voter', 'system'])
  actorRole?: AuditActorRole;

  @IsString()
  @MinLength(3)
  action!: string;

  @IsString()
  @MinLength(3)
  resource!: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export interface AuditLogQuery {
  actorId?: string;
  actorRole?: AuditActorRole;
  action?: string;
  resource?: string;
  electionId?: string;
  from?: string;
  to?: string;
  limit?: number;
}
