import { Test } from '@nestjs/testing';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

describe('BlockchainController', () => {
  let controller: BlockchainController;

  const serviceMock = {
    addBlock: jest.fn().mockReturnValue({ index: 2, prevHash: 'p', hash: 'h' }),
    verify: jest.fn().mockReturnValue({ valid: true }),
    getChain: jest.fn().mockReturnValue([{ index: 0, hash: 'genesis' }]),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [{ provide: BlockchainService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(BlockchainController);
  });

  it('POST add should return new block', () => {
    const res = controller.add({
      voterId: 'u1',
      electionId: 'e1',
      candidateId: 'c1',
      timestamp: Date.now(),
    } as any);

    expect(res.ok).toBe(true);
    expect(res.block).toHaveProperty('hash');
  });

  it('POST verify should return valid true', () => {
    expect(controller.verify()).toEqual({ valid: true });
  });
});
