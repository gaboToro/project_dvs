import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('UserService Controller', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get(AppController);
  });

  it('health should return ok', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'user-service' });
  });

  it('getUser should return a user', () => {
    const user = controller.getUser('123');
    expect(user.id).toBe('123');
    expect(user.enabled).toBe(true);
  });
});