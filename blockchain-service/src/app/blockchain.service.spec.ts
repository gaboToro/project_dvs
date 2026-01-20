// test unitario / unit test
import { BlockchainService } from './blockchain.service';

const docs: any[] = [];
const collectionMock = {
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      toArray: jest.fn(async () => [...docs].sort((a, b) => a.index - b.index)),
    })),
  })),
  insertOne: jest.fn(async (doc: any) => {
    docs.push(doc);
    return { insertedId: `${doc.index}` };
  }),
};

jest.mock('./db/mongo', () => ({
  getMongoDb: jest.fn(async () => ({
    collection: jest.fn(() => collectionMock),
  })),
}));

// Suite: BlockchainService - agrupa pruebas relacionadas / Suite: BlockchainService - grouping of related tests
describe('BlockchainService', () => {
  let service: BlockchainService;

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    service = new BlockchainService();
  });

  // Caso de prueba: should create genesis chain on init - comportamiento esperado bajo condiciones especificas / Test case: should create genesis chain on init - expected behavior under specific conditions
  it('should create genesis chain on init', async () => {
    docs.length = 0;
    const chain = await service.getChain();
    expect(chain.length).toBeGreaterThanOrEqual(1);
    expect(chain[0]).toHaveProperty('hash');
  });

  // Caso de prueba: should add a block and keep hash linkage - comportamiento esperado bajo condiciones especificas / Test case: should add a block and keep hash linkage - expected behavior under specific conditions
  it('should add a block and keep hash linkage', async () => {
    docs.length = 0;
    const before = await service.getChain();
    const prev = before[before.length - 1];

    const block = await service.addBlock({
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
  it('validate should return valid true for untampered chain', async () => {
    docs.length = 0;
    expect(await service.verify()).toEqual({ valid: true });
  });
});
