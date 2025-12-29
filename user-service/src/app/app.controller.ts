import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service' };
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return { id, name: 'Usuario Demo', role: 'voter', enabled: true };
  }

  @Get(':id/eligible')
  eligible(@Param('id') id: string) {
    return { id, eligible: true };
  }
}
