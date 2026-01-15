import axios from 'axios';

describe('GET /api/email/health', () => {
  it('should return health payload', async () => {
    const res = await axios.get(`/api/email/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'email-notifier-service' });
  });
});
