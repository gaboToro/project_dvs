import { BadRequestException, Body, Controller, Headers, Post, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CastVoteRequestDto, VoteCastEvent } from '@org/contracts';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHash, randomUUID } from 'crypto';
import { publishVoteCast } from './mq/kafka.producer';
import { query } from './db/postgres';

@Controller('votes')
export class VotingController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly http: HttpService,
  ) {}

  @Post()
  async castVote(
    @Headers('authorization') authHeader: string | undefined,
    @Headers('x-request-id') requestIdHeader: string | undefined,
    @Body() body: CastVoteRequestDto,
  ) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.replace('Bearer ', '');

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET!,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const roles: string[] = payload?.roles ?? [];
    if (!roles.includes('voter')) {
      throw new UnauthorizedException('Voter role required');
    }

    const voterId = payload?.sub;
    if (!voterId) throw new UnauthorizedException('Invalid voter');

    if (!body?.electionId || !body?.candidateId) {
      throw new BadRequestException('Invalid vote payload');
    }

    const voterHash = this.hashVoter(voterId);
    const alreadyVoted = await query<{ id: string }>(
      'SELECT id FROM votes WHERE election_id = $1 AND voter_hash = $2 LIMIT 1',
      [body.electionId, voterHash],
    );
    if (alreadyVoted.length > 0) {
      throw new BadRequestException('User has already voted');
    }

    const event: VoteCastEvent = {
      voterId,
      electionId: body.electionId,
      candidateId: body.candidateId,
      timestamp: Date.now(),
    };

    const baseUrl = process.env.BLOCKCHAIN_SERVICE_URL ?? 'http://localhost:3003';

    try {
      const res = await firstValueFrom(
        this.http.post(`${baseUrl}/api/chain/add`, event, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const requestId = requestIdHeader || randomUUID();
      let voteId: string | undefined;
      let castAt: string | undefined;
      try {
        const inserted = await query<{ id: string; cast_at: Date }>(
          `INSERT INTO votes (election_id, candidate_id, voter_hash, request_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id, cast_at`,
          [body.electionId, body.candidateId, voterHash, requestId],
        );
        voteId = inserted[0]?.id;
        castAt = inserted[0]?.cast_at?.toISOString();
      } catch (dbError: any) {
        if (dbError?.code === '23505') {
          throw new BadRequestException('User has already voted');
        }
        throw dbError;
      }

      try {
        await publishVoteCast(event);
      } catch (kafkaError: any) {
        const reason = kafkaError?.code ?? kafkaError?.message ?? 'unknown error';
        console.warn(`Kafka publish failed: ${reason}`);
      }

      return {
        ok: true,
        message: 'Vote registered and anchored to blockchain',
        event,
        blockchain: res.data,
        voteId,
        castAt,
      };
    } catch (e: any) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      // Reject if blockchain fails.
      const reason = e?.code ?? e?.message ?? 'unknown error';
      throw new ServiceUnavailableException(
        `Blockchain service unavailable: ${reason}`,
      );
    }
  }

  private hashVoter(voterId: string): string {
    const secret = process.env.VOTER_HASH_SECRET ?? 'dev-voter-hash-secret';
    return createHash('sha256').update(`${voterId}:${secret}`).digest('hex');
  }
}
