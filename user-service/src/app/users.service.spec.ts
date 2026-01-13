import { UsersService } from './user.service';

describe('UsersService', () => {
  let svc: UsersService;

  beforeEach(async () => {
    process.env.SEED_DEFAULT_USERS = 'true';
    svc = new UsersService();
    await svc.onModuleInit();
  });

  it('should list seeded users', async () => {
    const list = await svc.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('should create and fetch user', async () => {
    const username = `newuser-${Date.now()}`;
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
    const list = await svc.list();
    const admin = list.find((u) => u.role === 'admin');
    if (!admin) throw new Error('Admin user not found');
    const res = await svc.eligibility(admin.id);
    expect(res.eligible).toBe(false);
  });
});
