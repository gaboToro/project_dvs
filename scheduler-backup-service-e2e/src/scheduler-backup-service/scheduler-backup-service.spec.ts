import axios from 'axios';

describe('GET /api/backup/health', () => {
  it('should return health payload', async () => {
    const res = await axios.get(`/api/backup/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'scheduler-backup-service' });
  });
});
