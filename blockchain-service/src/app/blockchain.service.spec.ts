// test unitario / unit test
import { BlockchainService } from './blockchain.service';

// Suite: BlockchainService - agrupa pruebas relacionadas / Suite: BlockchainService - grouping of related tests
describe('BlockchainService', () => {
  let service: BlockchainService;

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    service = new BlockchainService();
  });

  // Caso de prueba: should create genesis chain on init - comportamiento esperado bajo condiciones especificas / Test case: should create genesis chain on init - expected behavior under specific conditions
  it('should create genesis chain on init', () => {
    const chain = service.getChain();
    expect(chain.length).toBeGreaterThanOrEqual(1);
    expect(chain[0]).toHaveProperty('hash');
  });

  // Caso de prueba: should add a block and keep hash linkage - comportamiento esperado bajo condiciones especificas / Test case: should add a block and keep hash linkage - expected behavior under specific conditions
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

  // Caso de prueba: validate should return valid true for untampered chain - comportamiento esperado bajo condiciones especificas / Test case: validate should return valid true for untampered chain - expected behavior under specific conditions
  it('validate should return valid true for untampered chain', () => {
    expect(service.verify()).toEqual({ valid: true });
  });
});
