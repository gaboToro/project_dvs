import axios from 'axios';

describe('GET /api/audit/health', () => {
  it('should return ok payload', async () => {
    const res = await axios.get(`/api/audit/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'audit-log-service' });
  });
});
