import { Body, Controller, ForbiddenException, Get, Headers, Param, Patch, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { createHealthPayload } from '@org/contracts';
import type { CreateUserRequestDto, LoginRequestDto, UpdateUserRequestDto } from '@org/contracts';
import { JwtAuthGuard, requireAdminOrSelf } from './authz';
import { UsersService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('health')
  health() {
    return createHealthPayload('user-service');
  }

  // Admin-only list (no admin => only self)
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any) {
    const roles = req.user?.roles ?? [];
    if (!roles.includes('admin')) {
      return [await this.users.getById(req.user.sub)];
    }
    return this.users.list();
  }

  // Admin or self
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    requireAdminOrSelf(req, id);
    return this.users.getById(id);
  }

  // Admin-only create
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) body: CreateUserRequestDto,
  ) {
    const roles = req.user?.roles ?? [];
    if (!roles.includes('admin')) throw new ForbiddenException('Admin required');
    return this.users.create(body);
  }

  // Admin or self update
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) body: UpdateUserRequestDto,
  ) {
    requireAdminOrSelf(req, id);
    const roles = req.user?.roles ?? [];
    if (!roles.includes('admin')) {
      // user normal: solo puede actualizar fullName
      return this.users.update(id, { fullName: body.fullName, email: body.email });
    }
    return this.users.update(id, body);
  }

  // Elegibilidad
  @UseGuards(JwtAuthGuard)
  @Get(':id/eligible')
  async eligible(@Req() req: any, @Param('id') id: string) {
    requireAdminOrSelf(req, id);
    return this.users.eligibility(id);
  }

  @Post('validate')
  async validate(
    @Headers('x-internal-token') token: string | undefined,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) body: LoginRequestDto,
  ) {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected || token !== expected) throw new ForbiddenException('Invalid internal token');
    return this.users.validateCredentials(body.username, body.password);
  }
}


