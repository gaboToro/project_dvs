import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CastVoteRequestDto, VoteCastEvent } from '@org/contracts';

@Controller('votes')
export class VotingController {
  private readonly votedUsers = new Set<string>();

  constructor(private readonly jwtService: JwtService) {}

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

    this.votedUsers.add(voterId);

    const event: VoteCastEvent = {
      voterId,
      electionId: body.electionId,
      candidateId: body.candidateId,
      timestamp: Date.now(),
    };

    // Fase 3: esto irá a Kafka.
    console.log('VoteCast event:', event);

    return { ok: true, message: 'Vote registered', event };
  }
}