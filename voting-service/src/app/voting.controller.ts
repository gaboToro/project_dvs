import { BadRequestException, Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CastVoteRequestDto, VoteCastEvent } from '@org/contracts';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceUnavailableException } from '@nestjs/common';
import { publishVoteCast } from './mq/kafka.producer';

@Controller('votes')
export class VotingController {
  private readonly votedKeys = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly http: HttpService,
  ) {}

  @Post()
  async castVote(
    @Headers('authorization') authHeader: string | undefined,
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

    const voteKey = `${body.electionId}:${voterId}`;
    if (this.votedKeys.has(voteKey)) {
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

      // Confirm only when blockchain anchors the vote.
      this.votedKeys.add(voteKey);

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
      };
    } catch (e: any) {
      // Reject if blockchain fails.
      const reason = e?.code ?? e?.message ?? 'unknown error';
      throw new ServiceUnavailableException(
        `Blockchain service unavailable: ${reason}`,
      );
    }
  }
}
