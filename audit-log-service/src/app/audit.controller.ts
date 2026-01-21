import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { createHealthPayload } from '../../../libs/contracts/src/lib/health';
import type { AuditLogDto, AuditLogQuery, CreateAuditLogRequestDto } from '@org/contracts';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('health')
  health() {
    return createHealthPayload('audit-log-service');
  }

  @Post('log')
  async create(
    @Headers('x-internal-token') token: string | undefined,
    @Headers('x-forwarded-for') forwarded: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) body: CreateAuditLogRequestDto,
  ): Promise<AuditLogDto> {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (expected && token !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }

    const ip = forwarded?.split(',')[0]?.trim();
    return this.audit.create({
      ...body,
      ip: ip || null,
      userAgent: userAgent || null,
    });
  }

  @Get()
  list(@Query() query: AuditLogQuery): Promise<AuditLogDto[]> {
    return this.audit.list(query);
  }
}

