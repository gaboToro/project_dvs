import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { BlockDto } from '@org/contracts';

@Injectable()
export class ResultsService {
  constructor(private readonly http: HttpService) {}

  async getResultsByElection(electionId: string) {
    const blockchainUrl = process.env.BLOCKCHAIN_SERVICE_URL ?? 'http://localhost:3003';

    const res = await firstValueFrom(
      this.http.get<BlockDto[]>(`${blockchainUrl}/api/chain`),
    );

    const chain = res.data ?? [];

    // Lógica de filtrado: excluir bloque génesis y filtrar por ID de elección
    const votes = chain
      .filter((b) => b.index > 0)
      .map((b) => b.data)
      .filter((v) => v.electionId === electionId);

    const counts: Record<string, number> = {};
    for (const vote of votes) {
      counts[vote.candidateId] = (counts[vote.candidateId] ?? 0) + 1;
    }

    return {
      electionId,
      totalVotes: votes.length,
      results: counts,
    };
  }
}