import { Injectable } from '@nestjs/common';
import { createHealthPayload } from '@org/contracts';

@Injectable()
export class AppService {
  health() {
    return createHealthPayload('election-service');
  }
}


