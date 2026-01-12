import { Test } from '@nestjs/testing';
import { AppService } from './app.service'; 

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('health', () => { 
    it('should return health status', () => {
      expect(service.health()).toEqual({ 
        status: 'ok', 
        service: 'auth-service' 
      });
    });
  });
});