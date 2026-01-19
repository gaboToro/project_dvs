// test e2e / e2e test
import axios from 'axios';

// Suite: GET /api/ratelimit/health - agrupa pruebas relacionadas / Suite: GET /api/ratelimit/health - grouping of related tests
describe('GET /api/ratelimit/health', () => {
  // Caso de prueba: should return ok payload - comportamiento esperado bajo condiciones especificas / Test case: should return ok payload - expected behavior under specific conditions
  it('should return ok payload', async () => {
    const res = await axios.get(`/api/ratelimit/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'rate-limiter-service' });
  });
});
