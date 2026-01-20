// test unitario / unit test
import { Test } from '@nestjs/testing';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

// Suite: BlockchainController - agrupa pruebas relacionadas / Suite: BlockchainController - grouping of related tests
describe('BlockchainController', () => {
  let controller: BlockchainController;

  const serviceMock = {
    addBlock: jest.fn().mockResolvedValue({ index: 2, prevHash: 'p', hash: 'h' }),
    verify: jest.fn().mockResolvedValue({ valid: true }),
    getChain: jest.fn().mockResolvedValue([{ index: 0, hash: 'genesis' }]),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [{ provide: BlockchainService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(BlockchainController);
  });

  // Caso de prueba: POST add should return new block - comportamiento esperado bajo condiciones especificas / Test case: POST add should return new block - expected behavior under specific conditions
  it('POST add should return new block', async () => {
    const res = await controller.add({
      voterId: 'u1',
      electionId: 'e1',
      candidateId: 'c1',
      timestamp: Date.now(),
    } as any);

    expect(res.ok).toBe(true);
    expect(res.block).toHaveProperty('hash');
  });

  // Caso de prueba: POST verify should return valid true - comportamiento esperado bajo condiciones especificas / Test case: POST verify should return valid true - expected behavior under specific conditions
  it('POST verify should return valid true', async () => {
    await expect(controller.verify()).resolves.toEqual({ valid: true });
  });
});
