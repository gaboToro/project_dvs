// test e2e / e2e test
import axios from 'axios';

// Suite: GET /api/email/health - agrupa pruebas relacionadas / Suite: GET /api/email/health - grouping of related tests
describe('GET /api/email/health', () => {
  // Caso de prueba: should return health payload - comportamiento esperado bajo condiciones especificas / Test case: should return health payload - expected behavior under specific conditions
  it('should return health payload', async () => {
    const res = await axios.get(`/api/email/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'email-notifier-service' });
  });
});
