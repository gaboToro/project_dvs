// test unitario / unit test
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './user.service';

// Suite: UsersController - agrupa pruebas relacionadas / Suite: UsersController - grouping of related tests
describe('UsersController', () => {
  let controller: UsersController;

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test' })],
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  // Caso de prueba: health should return ok - comportamiento esperado bajo condiciones especificas / Test case: health should return ok - expected behavior under specific conditions
  it('health should return ok', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'user-service' });
  });
});