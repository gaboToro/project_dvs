import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './user.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test' })],
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  it('health should return ok', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'user-service' });
  });
});