import { UsersService } from './user.service';

describe('UsersService', () => {
  let svc: UsersService;

  beforeEach(() => {
    svc = new UsersService();
  });

  it('should list seeded users', () => {
    const list = svc.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('should create and fetch user', () => {
    const created = svc.create({
      username: 'newuser',
      fullName: 'Nuevo Usuario',
      role: 'voter',
      enabled: true,
    });

    const fetched = svc.getById(created.id);
    expect(fetched.username).toBe('newuser');
    expect(fetched.enabled).toBe(true);
  });

  it('eligibility should be false for non-voter', () => {
    const admin = svc.getById('admin');
    const res = svc.eligibility(admin.id);
    expect(res.eligible).toBe(false);
  });
});