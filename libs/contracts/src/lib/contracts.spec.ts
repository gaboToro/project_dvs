// test unitario / unit test
import { contracts } from './contracts.js';

// Suite: contracts - agrupa pruebas relacionadas / Suite: contracts - grouping of related tests
describe('contracts', () => {
  // Caso de prueba: should work - comportamiento esperado bajo condiciones especificas / Test case: should work - expected behavior under specific conditions
  it('should work', () => {
    expect(contracts()).toEqual('contracts');
  });
});
