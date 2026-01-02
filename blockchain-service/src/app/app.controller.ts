import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('chain')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }
}
