import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { UsersService } from './user.service';
import { JwtAuthGuard, requireAdminOrSelf } from './authz';

@Controller('users')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
  ) {}

  @Get('health')
  health() {
    return this.appService.getHealth();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUser(@Param('id') id: string, @Req() req: any) {
    // Aplicamos la lógica de seguridad de authz.ts
    requireAdminOrSelf(req, id);
    return this.usersService.getById(id);
  }

  @Get(':id/eligible')
  eligible(@Param('id') id: string) {
    return this.usersService.eligibility(id);
  }
}