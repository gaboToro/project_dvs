import axios from 'axios';

describe('GET /api/ratelimit/health', () => {
  it('should return ok payload', async () => {
    const res = await axios.get(`/api/ratelimit/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'rate-limiter-service' });
  });
});
