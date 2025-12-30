import { ElectionService } from './election.service';

describe('ElectionService (unit)', () => {
  it('should enforce single OPEN election rule', async () => {
    const svc = new ElectionService() as any;

    // Mock supabase calls
    svc.supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ data: [{ id: 'other-open' }], error: null }),
        }),
      }),
    };

    await expect(svc.openElection('target')).rejects.toThrow('There is already an OPEN election');
  });
});