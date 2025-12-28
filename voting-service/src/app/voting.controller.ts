import { BadRequestException, Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CastVoteRequestDto, VoteCastEvent } from '@org/contracts';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceUnavailableException } from '@nestjs/common';

@Controller('votes')
export class VotingController {
  private readonly votedUsers = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly http: HttpService,
  ) { }

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

    const voterId = payload?.sub;
    if (!voterId) throw new UnauthorizedException('Invalid voter');

    if (!body?.electionId || !body?.candidateId) {
      throw new BadRequestException('Invalid vote payload');
    }

    if (this.votedUsers.has(voterId)) {
      throw new BadRequestException('User has already voted');
    }

    const event: VoteCastEvent = {
      voterId,
      electionId: body.electionId,
      candidateId: body.candidateId,
      timestamp: Date.now(),
    };

    // Fase 3: esto irá a Kafka.
    console.log('VoteCast event:', event);

    const baseUrl = process.env.BLOCKCHAIN_SERVICE_URL ?? 'http://localhost:3003';

    try {
      const res = await firstValueFrom(
        this.http.post(`${baseUrl}/api/chain/add`, event, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      // ✅ Solo confirmamos el voto cuando blockchain lo ancla
      this.votedUsers.add(voterId);

      return {
        ok: true,
        message: 'Vote registered and anchored to blockchain',
        event,
        blockchain: res.data,
      };
    } catch (e: any) {
      // ✅ Rechazar si blockchain falla
      const reason = e?.code ?? e?.message ?? 'unknown error';
      throw new ServiceUnavailableException(
        `Blockchain service unavailable: ${reason}`,
      );
    }
  }
}