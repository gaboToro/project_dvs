import { Injectable } from '@nestjs/common';
import { createHealthPayload } from '../../../libs/contracts/src/lib/health';

@Injectable()
export class AppService {
  health() {
    return createHealthPayload('auth-service');
  }
}

