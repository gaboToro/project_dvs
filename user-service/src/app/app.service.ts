import { Injectable } from '@nestjs/common';
import { createHealthPayload } from '@org/contracts';

@Injectable()
export class AppService {
  getHealth() {
    return createHealthPayload('user-service');
  }
}
