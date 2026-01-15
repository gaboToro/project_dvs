import axios from 'axios';

describe('GET /api/reports/health', () => {
  it('should return health payload', async () => {
    const res = await axios.get(`/api/reports/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'reporting-service' });
  });
});
