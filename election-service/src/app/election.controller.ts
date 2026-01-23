import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UnauthorizedException, ForbiddenException, Query } from '@nestjs/common';
import { createHealthPayload } from '@org/contracts';
import { JwtService } from '@nestjs/jwt';
import type { CreateCandidateRequestDto, CreateElectionRequestDto, UpdateElectionRequestDto, ElectionStatus } from '@org/contracts';
import { ElectionService } from './election.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

function requireAdmin(payload: any) {
  const roles: string[] = payload?.roles ?? [];
  if (!roles.includes('admin')) throw new ForbiddenException('Admin role required');
}

@Controller('elections')
export class ElectionController {
  constructor(
    private readonly service: ElectionService,
    private readonly jwt: JwtService,
    private readonly http: HttpService,
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
    return createHealthPayload('election-service');
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
    const created = await this.service.createElection(dto);
    void this.audit('CREATE_ELECTION', payload?.sub, 'admin', {
      electionId: created.id,
      title: created.title,
    });
    return created;
  }

  @Patch(':id')
  async update(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateElectionRequestDto,
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    const updated = await this.service.updateElection(id, dto);
    void this.audit('UPDATE_ELECTION', payload?.sub, 'admin', {
      electionId: id,
    });
    return updated;
  }

  @Post(':id/open')
  async open(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    const res = await this.service.openElection(id);
    void this.audit('OPEN_ELECTION', payload?.sub, 'admin', { electionId: id });
    return res;
  }

  @Post(':id/close')
  async close(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    const res = await this.service.closeElection(id);
    void this.audit('CLOSE_ELECTION', payload?.sub, 'admin', { electionId: id });
    return res;
  }

  @Post('sync')
  async sync(@Headers('authorization') auth: string | undefined) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    return this.service.syncElectionWindows();
  }

  @Post(':id/candidates')
  async addCandidate(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Body() dto: CreateCandidateRequestDto,
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    const created = await this.service.addCandidate(id, dto);
    void this.audit('ADD_CANDIDATE', payload?.sub, 'admin', {
      electionId: id,
      candidateId: created.id,
    });
    return created;
  }

  @Delete(':id/candidates/:candidateId')
  async removeCandidate(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Param('candidateId') candidateId: string,
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    const res = await this.service.removeCandidate(id, candidateId);
    void this.audit('REMOVE_CANDIDATE', payload?.sub, 'admin', {
      electionId: id,
      candidateId,
    });
    return res;
  }

  @Patch(':id/candidates/:candidateId')
  async updateCandidate(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Param('candidateId') candidateId: string,
    @Body() dto: { name?: string; plan?: string | null },
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    const updated = await this.service.updateCandidate(id, candidateId, dto);
    void this.audit('UPDATE_CANDIDATE', payload?.sub, 'admin', {
      electionId: id,
      candidateId,
    });
    return updated;
  }

  @Delete(':id')
  async removeElection(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
  ) {
    const payload = await this.getJwtPayload(auth);
    requireAdmin(payload);
    const res = await this.service.deleteElection(id);
    void this.audit('DELETE_ELECTION', payload?.sub, 'admin', { electionId: id });
    return res;
  }

  private async audit(
    action: string,
    actorId?: string,
    actorRole?: string,
    metadata?: Record<string, unknown>,
  ) {
    const auditUrl = process.env.AUDIT_LOG_SERVICE_URL;
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!auditUrl || !token) return;

    try {
      await firstValueFrom(
        this.http.post(
          `${auditUrl}/api/audit/log`,
          {
            actorId,
            actorRole,
            action,
            resource: 'elections',
            metadata,
          },
          { headers: { 'x-internal-token': token } },
        ),
      );
    } catch {
      // Best effort only.
    }
  }
}


