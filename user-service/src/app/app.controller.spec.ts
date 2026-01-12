import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersService } from './user.service';
import { JwtService } from '@nestjs/jwt';

describe('UserService Controller', () => {
  let controller: AppController;

  // Creamos un mock para el JwtService para que el JwtAuthGuard no falle
  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        UsersService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('health should return ok', () => {
    expect(controller.health()).toEqual({ 
      status: 'ok', 
      service: 'user-service' 
    });
  });

  it('getUser should return a user', () => {
    // Como ahora el controlador usa el servicio real, 
    // buscamos al usuario demo que definiste en UsersService
    const user = controller.getUser('voter-001', { user: { sub: 'voter-001' } } as any);
    
    expect(user.id).toBe('voter-001');
    expect(user.username).toBe('voter001');
  });

  it('eligible should return eligibility status', () => {
    const res = controller.eligible('voter-001');
    expect(res).toEqual({ id: 'voter-001', eligible: true });
  });
});