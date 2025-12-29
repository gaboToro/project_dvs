import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import type { CreateUserRequestDto, UpdateUserRequestDto } from '@org/contracts';
import { JwtAuthGuard, requireAdminOrSelf } from './authz';
import { UsersService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service' };
  }

  // Admin-only list (no admin => only self)
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    const roles = req.user?.roles ?? [];
    if (!roles.includes('admin')) {
      return [this.users.getById(req.user.sub)];
    }
    return this.users.list();
  }

  // Admin or self
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    requireAdminOrSelf(req, id);
    return this.users.getById(id);
  }

  // Admin-only create
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
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
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) body: UpdateUserRequestDto,
  ) {
    requireAdminOrSelf(req, id);
    const roles = req.user?.roles ?? [];
    if (!roles.includes('admin')) {
      // user normal: solo puede actualizar fullName
      return this.users.update(id, { fullName: body.fullName });
    }
    return this.users.update(id, body);
  }

  // Elegibilidad
  @UseGuards(JwtAuthGuard)
  @Get(':id/eligible')
  eligible(@Req() req: any, @Param('id') id: string) {
    requireAdminOrSelf(req, id);
    return this.users.eligibility(id);
  }
}