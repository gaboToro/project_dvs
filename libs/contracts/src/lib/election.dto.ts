import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export type ElectionStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface ElectionDto {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status: ElectionStatus;
  createdAt?: string;
}

export interface CandidateDto {
  id: string;
  electionId: string;
  name: string;
  plan?: string | null;
  photoUrl?: string | null;
  createdAt?: string;
}

export interface ElectionWithCandidatesDto extends ElectionDto {
  candidates: CandidateDto[];
}

/** ADMIN */
export class CreateElectionRequestDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;
}

export class UpdateElectionRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'OPEN', 'CLOSED'])
  status?: ElectionStatus;
}

export class CreateCandidateRequestDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export interface OpenElectionResponseDto {
  ok: boolean;
  electionId: string;
  status: ElectionStatus;
}

export interface CloseElectionResponseDto {
  ok: boolean;
  electionId: string;
  status: ElectionStatus;
}
