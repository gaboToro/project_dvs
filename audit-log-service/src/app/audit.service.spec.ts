/// <reference types="jest" />
import { AuditService } from './audit.service';
import { query } from './db/postgres';

jest.mock('./db/postgres', () => ({
  query: jest.fn(),
}));

describe('AuditService', () => {
  beforeEach(() => {
    (query as jest.Mock).mockReset();
  });

  it('creates an audit log entry', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      {
        id: 'a1',
        actor_id: 'admin',
        actor_role: 'admin',
        action: 'LOGIN',
        resource: 'auth',
        resource_id: null,
        metadata: { ok: true },
        ip: '127.0.0.1',
        user_agent: 'jest',
        created_at: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const svc = new AuditService();
    const res = await svc.create({
      actorId: 'admin',
      actorRole: 'admin',
      action: 'LOGIN',
      resource: 'auth',
      metadata: { ok: true },
      ip: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(res.id).toBe('a1');
    expect(res.action).toBe('LOGIN');
  });

  it('lists audit logs with filters', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      {
        id: 'a2',
        actor_id: 'voter-1',
        actor_role: 'voter',
        action: 'VOTE_CAST',
        resource: 'votes',
        resource_id: 'e1',
        metadata: null,
        ip: null,
        user_agent: null,
        created_at: new Date('2026-01-02T00:00:00Z'),
      },
    ]);

    const svc = new AuditService();
    const res = await svc.list({ actorId: 'voter-1', limit: 10 });

    expect(res.length).toBe(1);
    expect(res[0].resource).toBe('votes');
  });
});
