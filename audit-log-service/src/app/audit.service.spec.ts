// test unitario / unit test
/// <reference types="jest" />
import { AuditService } from './audit.service';
import { query } from './db/postgres';

jest.mock('./db/postgres', () => ({
  query: jest.fn(),
}));

// Suite: AuditService - agrupa pruebas relacionadas / Suite: AuditService - grouping of related tests
describe('AuditService', () => {
  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    (query as jest.Mock).mockReset();
  });

  // Caso de prueba: creates an audit log entry - comportamiento esperado bajo condiciones especificas / Test case: creates an audit log entry - expected behavior under specific conditions
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

  // Caso de prueba: lists audit logs with filters - comportamiento esperado bajo condiciones especificas / Test case: lists audit logs with filters - expected behavior under specific conditions
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
