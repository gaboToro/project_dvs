import { BlockchainService } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(() => {
    service = new BlockchainService();
  });

  it('should create genesis chain on init', () => {
    const chain = service.getChain();
    expect(chain.length).toBeGreaterThanOrEqual(1);
    expect(chain[0]).toHaveProperty('hash');
  });

  it('should add a block and keep hash linkage', () => {
    const before = service.getChain();
    const prev = before[before.length - 1];

    const block = service.addBlock({
      voterId: 'u1',
      electionId: 'e1',
      candidateId: 'c1',
      timestamp: Date.now(),
    } as any);

    expect(block).toHaveProperty('hash');
    expect(block).toHaveProperty('prevHash');
    expect(block.prevHash).toBe(prev.hash);
  });

  it('validate should return valid true for untampered chain', () => {
    expect(service.verify()).toEqual({ valid: true });
  });
});
