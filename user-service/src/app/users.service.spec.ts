import { UsersService } from './user.service';
import { query } from './db/postgres';

jest.mock('./db/postgres', () => ({
  query: jest.fn(),
}));

describe('UsersService', () => {
  let svc: UsersService;

  beforeEach(async () => {
    process.env.SEED_DEFAULT_USERS = 'false';
    svc = new UsersService();
    await svc.onModuleInit();
  });

  it('should list users', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      {
        id: 'u1',
        username: 'admin',
        full_name: 'Administrador',
        email: null,
        role: 'admin',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    const list = await svc.list();
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('should create and fetch user', async () => {
    const username = `newuser-${Date.now()}`;
    (query as jest.Mock)
      .mockResolvedValueOnce([]) // exists check
      .mockResolvedValueOnce([
        {
          id: 'u2',
          username,
          full_name: 'Nuevo Usuario',
          email: null,
          role: 'voter',
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]) // insert
      .mockResolvedValueOnce([
        {
          id: 'u2',
          username,
          full_name: 'Nuevo Usuario',
          email: null,
          role: 'voter',
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]); // getById

    const created = await svc.create({
      username,
      password: 'testpass123',
      fullName: 'Nuevo Usuario',
      role: 'voter',
      enabled: true,
    });

    const fetched = await svc.getById(created.id);
    expect(fetched.username).toBe(username);
    expect(fetched.enabled).toBe(true);
  });

  it('eligibility should be false for non-voter', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      {
        id: 'admin-id',
        role: 'admin',
        enabled: true,
      },
    ]);
    const res = await svc.eligibility('admin-id');
    expect(res.eligible).toBe(false);
  });
});
