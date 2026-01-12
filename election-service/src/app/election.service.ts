import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { CandidateDto, CreateCandidateRequestDto, CreateElectionRequestDto, ElectionDto, ElectionStatus, ElectionWithCandidatesDto, UpdateElectionRequestDto } from '@org/contracts';
import { getSupabaseAdmin } from './supabase.client';

const validStatuses = new Set<ElectionStatus>(['DRAFT', 'OPEN', 'CLOSED']);

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

  async ping(): Promise<void> {
    const { error } = await this.supabase.from('elections').select('id').limit(1);
    if (error) throw new ServiceUnavailableException(error.message);
  }

  async listElections(status?: ElectionStatus): Promise<ElectionDto[]> {
    if (status && !validStatuses.has(status)) {
      throw new BadRequestException('Invalid status');
    }

    let query = this.supabase
      .from('elections')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map(mapElection);
  }

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
    if (!data) throw new NotFoundException('Election not created');
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

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Election not found');
      throw new BadRequestException(error.message);
    }
    if (!data) throw new NotFoundException('Election not found');
    return mapElection(data);
  }

  async addCandidate(electionId: string, dto: CreateCandidateRequestDto): Promise<CandidateDto> {
    // ensure election exists
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
    if (!data) throw new NotFoundException('Candidate not created');
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

  async updateCandidate(
    electionId: string,
    candidateId: string,
    dto: { name?: string; plan?: string | null },
  ): Promise<CandidateDto> {
    const election = await this.getElection(electionId);
    if (election.status === 'CLOSED') {
      throw new BadRequestException('Cannot modify candidates on CLOSED election');
    }

    if (!dto.name && dto.plan === undefined) {
      throw new BadRequestException('Candidate update payload empty');
    }

    const patch: any = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.plan !== undefined) patch.plan = dto.plan ?? null;

    const { data, error } = await this.supabase
      .from('candidates')
      .update(patch)
      .eq('id', candidateId)
      .eq('election_id', electionId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Candidate not found');
      throw new BadRequestException(error.message);
    }
    if (!data) throw new NotFoundException('Candidate not found');
    return mapCandidate(data);
  }

  async getElection(id: string): Promise<ElectionDto> {
    const { data, error } = await this.supabase
      .from('elections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Election not found');
      throw new NotFoundException(error.message);
    }
    if (!data) throw new NotFoundException('Election not found');
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

    // 2) validate dates
    const election = await this.getElectionWithCandidates(id);
    if (new Date(election.startsAt).getTime() >= new Date(election.endsAt).getTime()) {
      throw new BadRequestException('startsAt must be < endsAt');
    }

    const now = Date.now();
    if (now < new Date(election.startsAt).getTime()) {
      throw new BadRequestException('Election not started yet');
    }
    if (now >= new Date(election.endsAt).getTime()) {
      throw new BadRequestException('Election already ended');
    }

    // 3) must have candidates
    if (!election.candidates.length) {
      throw new BadRequestException('Cannot OPEN election without candidates');
    }

    const { data, error } = await this.supabase
      .from('elections')
      .update({ status: 'OPEN' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Election not found');
      throw new BadRequestException(error.message);
    }
    if (!data) throw new NotFoundException('Election not found');
    return { ok: true, electionId: data.id, status: data.status };
  }

  async closeElection(id: string): Promise<{ ok: true; electionId: string; status: ElectionStatus }> {
    const { data, error } = await this.supabase
      .from('elections')
      .update({ status: 'CLOSED' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Election not found');
      throw new BadRequestException(error.message);
    }
    if (!data) throw new NotFoundException('Election not found');
    return { ok: true, electionId: data.id, status: data.status };
  }

  async deleteElection(id: string): Promise<{ ok: true }> {
    const election = await this.getElection(id);
    if (election.status === 'OPEN') {
      throw new BadRequestException('Cannot delete OPEN election');
    }

    const { error: candidatesError } = await this.supabase
      .from('candidates')
      .delete()
      .eq('election_id', id);

    if (candidatesError) throw new BadRequestException(candidatesError.message);

    const { error } = await this.supabase
      .from('elections')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Election not found');
      throw new BadRequestException(error.message);
    }

    return { ok: true };
  }

  async syncElectionWindows(): Promise<{ closedCount: number; openedId?: string }> {
    const now = new Date().toISOString();

    const { data: closed, error: closeErr } = await this.supabase
      .from('elections')
      .update({ status: 'CLOSED' })
      .eq('status', 'OPEN')
      .lte('ends_at', now)
      .select('id');

    if (closeErr) throw new BadRequestException(closeErr.message);
    const closedCount = closed?.length ?? 0;

    const { data: openList, error: openErr } = await this.supabase
      .from('elections')
      .select('id')
      .eq('status', 'OPEN')
      .limit(1);

    if (openErr) throw new BadRequestException(openErr.message);
    const hasOpen = (openList ?? []).length > 0;

    if (hasOpen) {
      return { closedCount };
    }

    const { data: candidates, error: draftErr } = await this.supabase
      .from('elections')
      .select('*')
      .eq('status', 'DRAFT')
      .lte('starts_at', now)
      .gt('ends_at', now)
      .order('starts_at', { ascending: true })
      .limit(1);

    if (draftErr) throw new BadRequestException(draftErr.message);
    const election = candidates?.[0];
    if (!election) {
      return { closedCount };
    }

    const { count, error: countErr } = await this.supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('election_id', election.id);

    if (countErr) throw new BadRequestException(countErr.message);
    if (!count || count < 1) {
      return { closedCount };
    }

    const { data: opened, error: openErr2 } = await this.supabase
      .from('elections')
      .update({ status: 'OPEN' })
      .eq('id', election.id)
      .select('id')
      .single();

    if (openErr2) throw new BadRequestException(openErr2.message);
    return { closedCount, openedId: opened?.id };
  }
}
