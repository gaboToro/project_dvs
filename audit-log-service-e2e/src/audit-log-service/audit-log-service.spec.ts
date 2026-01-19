// test e2e / e2e test
import axios from 'axios';

// Suite: GET /api/audit/health - agrupa pruebas relacionadas / Suite: GET /api/audit/health - grouping of related tests
describe('GET /api/audit/health', () => {
  // Caso de prueba: should return ok payload - comportamiento esperado bajo condiciones especificas / Test case: should return ok payload - expected behavior under specific conditions
  it('should return ok payload', async () => {
    const res = await axios.get(`/api/audit/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'audit-log-service' });
  });
});
