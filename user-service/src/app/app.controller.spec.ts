// test unitario / unit test
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './user.service';

// Suite: UserService Controller - agrupa pruebas relacionadas / Suite: UserService Controller - grouping of related tests
describe('UserService Controller', () => {
  let controller: AppController;

  // Creamos un mock para el JwtService para que el JwtAuthGuard no falle
  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const usersMock = {
    getById: jest.fn(),
    eligibility: jest.fn(),
  };

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: UsersService, useValue: usersMock },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    usersMock.getById.mockResolvedValue({
      id: 'voter-001',
      username: 'voter001',
      fullName: 'Votante Demo',
      role: 'voter',
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    usersMock.eligibility.mockResolvedValue({ id: 'voter-001', eligible: true });
  });

  // Caso de prueba: health should return ok - comportamiento esperado bajo condiciones especificas / Test case: health should return ok - expected behavior under specific conditions
  it('health should return ok', () => {
    expect(controller.health()).toEqual({ 
      status: 'ok', 
      service: 'user-service' 
    });
  });

  // Caso de prueba: getUser should return a user - comportamiento esperado bajo condiciones especificas / Test case: getUser should return a user - expected behavior under specific conditions
  it('getUser should return a user', async () => {
    const user = await controller.getUser('voter-001', { user: { sub: 'voter-001' } } as any);
    
    expect(user.id).toBe('voter-001');
    expect(user.username).toBe('voter001');
  });

  // Caso de prueba: eligible should return eligibility status - comportamiento esperado bajo condiciones especificas / Test case: eligible should return eligibility status - expected behavior under specific conditions
  it('eligible should return eligibility status', async () => {
    const res = await controller.eligible('voter-001');
    expect(res).toEqual({ id: 'voter-001', eligible: true });
  });
});
