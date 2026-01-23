import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { ElectionDto, ElectionStatus, ElectionWithCandidatesDto } from '@org/contracts';
import { firstValueFrom } from 'rxjs';
import { query } from './db/postgres';

type VoteCountRow = {
  election_id: string;
  candidate_id: string;
  votes: number;
};

@Injectable()
export class ReportingService {
  constructor(private readonly http: HttpService) {}

  async buildElectionSummaryCsv(status?: ElectionStatus): Promise<string> {
    const generatedAt = new Date().toISOString();
    const elections = await this.fetchElections(status);
    const counts = await this.fetchVoteCounts();

    const lines: string[] = [];
    lines.push(
      [
        'electionId',
        'electionTitle',
        'status',
        'startsAt',
        'endsAt',
        'totalVotes',
        'candidateId',
        'candidateName',
        'votes',
        'generatedAt',
      ].join(','),
    );

    const electionsWithCandidates = await Promise.all(
      elections.map(async (election) => ({
        election,
        details: await this.fetchElectionWithCandidates(election.id),
      })),
    );

    for (const { election, details } of electionsWithCandidates) {
      const candidates = details.candidates ?? [];
      const totalVotes = candidates.reduce(
        (sum, candidate) => sum + this.getVotes(counts, election.id, candidate.id),
        0,
      );

      if (candidates.length === 0) {
        lines.push(
          [
            this.csv(election.id),
            this.csv(election.title),
            this.csv(election.status),
            this.csv(election.startsAt),
            this.csv(election.endsAt),
            String(totalVotes),
            '',
            '',
            '0',
            this.csv(generatedAt),
          ].join(','),
        );
        continue;
      }

      for (const candidate of candidates) {
        const votes = this.getVotes(counts, election.id, candidate.id);
        lines.push(
          [
            this.csv(election.id),
            this.csv(election.title),
            this.csv(election.status),
            this.csv(election.startsAt),
            this.csv(election.endsAt),
            String(totalVotes),
            this.csv(candidate.id),
            this.csv(candidate.name),
            String(votes),
            this.csv(generatedAt),
          ].join(','),
        );
      }
    }

    return lines.join('\n');
  }

  private async fetchElections(status?: ElectionStatus): Promise<ElectionDto[]> {
    const electionUrl = process.env.ELECTION_SERVICE_URL ?? 'http://localhost:3006';
    const url = status
      ? `${electionUrl}/api/elections?status=${encodeURIComponent(status)}`
      : `${electionUrl}/api/elections`;
    const res = await firstValueFrom(this.http.get<ElectionDto[]>(url));
    return res.data ?? [];
  }

  private async fetchElectionWithCandidates(id: string): Promise<ElectionWithCandidatesDto> {
    const electionUrl = process.env.ELECTION_SERVICE_URL ?? 'http://localhost:3006';
    const res = await firstValueFrom(
      this.http.get<ElectionWithCandidatesDto>(`${electionUrl}/api/elections/${id}`),
    );
    return res.data;
  }

  private async fetchVoteCounts(): Promise<VoteCountRow[]> {
    return query<VoteCountRow>(
      `SELECT election_id, candidate_id, COUNT(*)::int AS votes
       FROM votes
       GROUP BY election_id, candidate_id`,
    );
  }

  private getVotes(counts: VoteCountRow[], electionId: string, candidateId: string): number {
    const row = counts.find(
      (item) => item.election_id === electionId && item.candidate_id === candidateId,
    );
    return row ? Number(row.votes) : 0;
  }

  private csv(value: string | null | undefined): string {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }
}
