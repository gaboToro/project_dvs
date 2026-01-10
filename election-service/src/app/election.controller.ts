import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UnauthorizedException, ForbiddenException, Query } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CreateCandidateRequestDto, CreateElectionRequestDto, UpdateElectionRequestDto, ElectionStatus } from '@org/contracts';
import { ElectionService } from './election.service';

function requireAdmin(payload: any) {
  const roles: string[] = payload?.roles ?? [];
  if (!roles.includes('admin')) throw new ForbiddenException('Admin role required');
}

@Controller('elections')
export class ElectionController {
  constructor(
    private readonly service: ElectionService,
    private readonly jwt: JwtService,
  ) {}

  private async getJwtPayload(authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      return await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET! });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Get('health')
  async health() {
    await this.service.ping();
    return { status: 'ok', service: 'election-service' };
  }

  @Get()
  list(@Query('status') status?: ElectionStatus) {
    return this.service.listElections(status);
  }

  // PUBLIC
  @Get('active')
  getActive() {
    return this.service.getActiveElection();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getElectionWithCandidates(id);
  }

  // ADMIN
  @Post()
  async create(
    @Headers('authorization') auth: string | undefined,
    @Body() dto: CreateElectionRequestDto,
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    return this.service.createElection(dto);
  }

  @Patch(':id')
  async update(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateElectionRequestDto,
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    return this.service.updateElection(id, dto);
  }

  @Post(':id/open')
  async open(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    return this.service.openElection(id);
  }

  @Post(':id/close')
  async close(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    return this.service.closeElection(id);
  }

  @Post(':id/candidates')
  async addCandidate(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Body() dto: CreateCandidateRequestDto,
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    return this.service.addCandidate(id, dto);
  }

  @Delete(':id/candidates/:candidateId')
  async removeCandidate(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Param('candidateId') candidateId: string,
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    return this.service.removeCandidate(id, candidateId);
  }
}
