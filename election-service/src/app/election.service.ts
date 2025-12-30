import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CandidateDto, CreateCandidateRequestDto, CreateElectionRequestDto, ElectionDto, ElectionStatus, ElectionWithCandidatesDto, UpdateElectionRequestDto } from '@org/contracts';
import { getSupabaseAdmin } from './supabase.client';

function mapElection(row: any): ElectionDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapCandidate(row: any): CandidateDto {
  return {
    id: row.id,
    electionId: row.election_id,
    name: row.name,
    plan: row.plan,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  };
}

@Injectable()
export class ElectionService {
  private supabase = getSupabaseAdmin();

  async createElection(dto: CreateElectionRequestDto): Promise<ElectionDto> {
    if (new Date(dto.startsAt).getTime() >= new Date(dto.endsAt).getTime()) {
      throw new BadRequestException('startsAt must be < endsAt');
    }

    const { data, error } = await this.supabase
      .from('elections')
      .insert({
        title: dto.title,
        description: dto.description ?? null,
        starts_at: dto.startsAt,
        ends_at: dto.endsAt,
        status: 'DRAFT',
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapElection(data);
  }

  async updateElection(id: string, dto: UpdateElectionRequestDto): Promise<ElectionDto> {
    if (dto.startsAt && dto.endsAt) {
      if (new Date(dto.startsAt).getTime() >= new Date(dto.endsAt).getTime()) {
        throw new BadRequestException('startsAt must be < endsAt');
      }
    }

    const patch: any = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description ?? null;
    if (dto.startsAt !== undefined) patch.starts_at = dto.startsAt;
    if (dto.endsAt !== undefined) patch.ends_at = dto.endsAt;
    if (dto.status !== undefined) patch.status = dto.status;

    const { data, error } = await this.supabase
      .from('elections')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Election not found');
    return mapElection(data);
  }

  async addCandidate(electionId: string, dto: CreateCandidateRequestDto): Promise<CandidateDto> {
    // asegurar que exista
    const election = await this.getElection(electionId);

    if (election.status === 'CLOSED') {
      throw new BadRequestException('Cannot modify candidates on CLOSED election');
    }

    const { data, error } = await this.supabase
      .from('candidates')
      .insert({
        election_id: electionId,
        name: dto.name,
        plan: dto.plan ?? null,
        photo_url: dto.photoUrl ?? null,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapCandidate(data);
  }

  async removeCandidate(electionId: string, candidateId: string): Promise<{ ok: true }> {
    const election = await this.getElection(electionId);
    if (election.status === 'CLOSED') {
      throw new BadRequestException('Cannot modify candidates on CLOSED election');
    }

    const { error } = await this.supabase
      .from('candidates')
      .delete()
      .eq('id', candidateId)
      .eq('election_id', electionId);

    if (error) throw new BadRequestException(error.message);
    return { ok: true };
  }

  async getElection(id: string): Promise<ElectionDto> {
    const { data, error } = await this.supabase
      .from('elections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException(error.message);
    return mapElection(data);
  }

  async getElectionWithCandidates(id: string): Promise<ElectionWithCandidatesDto> {
    const election = await this.getElection(id);

    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .eq('election_id', id)
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    return {
      ...election,
      candidates: (data ?? []).map(mapCandidate),
    };
  }

  async getActiveElection(): Promise<ElectionWithCandidatesDto> {
    const { data, error } = await this.supabase
      .from('elections')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw new BadRequestException(error.message);
    const row = data?.[0];
    if (!row) throw new NotFoundException('No active election');

    return this.getElectionWithCandidates(row.id);
  }

  /**
   * Rule: 1 OPEN
   */
  async openElection(id: string): Promise<{ ok: true; electionId: string; status: ElectionStatus }> {
    // 1) no permitir si ya hay una OPEN distinta
    const { data: openList, error: openErr } = await this.supabase
      .from('elections')
      .select('id')
      .eq('status', 'OPEN');

    if (openErr) throw new BadRequestException(openErr.message);

    const alreadyOpen = (openList ?? []).some((e: any) => e.id !== id);
    if (alreadyOpen) {
      throw new BadRequestException('There is already an OPEN election');
    }

    // 2) validar fechas
    const election = await this.getElectionWithCandidates(id);
    if (new Date(election.startsAt).getTime() >= new Date(election.endsAt).getTime()) {
      throw new BadRequestException('startsAt must be < endsAt');
    }

    // 3) debe tener candidatos
    if (!election.candidates.length) {
      throw new BadRequestException('Cannot OPEN election without candidates');
    }

    const { data, error } = await this.supabase
      .from('elections')
      .update({ status: 'OPEN' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return { ok: true, electionId: data.id, status: data.status };
  }

  async closeElection(id: string): Promise<{ ok: true; electionId: string; status: ElectionStatus }> {
    const { data, error } = await this.supabase
      .from('elections')
      .update({ status: 'CLOSED' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return { ok: true, electionId: data.id, status: data.status };
  }
}