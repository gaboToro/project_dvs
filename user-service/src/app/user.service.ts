import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateUserRequestDto, EligibilityResponseDto, UpdateUserRequestDto, UserDto, UserRole } from '@org/contracts';
import { randomUUID } from 'crypto';

type InternalUser = UserDto & { passwordHash?: string };

@Injectable()
export class UsersService {
  private readonly users = new Map<string, InternalUser>();

  constructor() {
    // Seed mínimo defendible (luego lo migras a BD)
    const now = Date.now();
    const admin: InternalUser = {
      id: 'admin',
      username: 'admin',
      fullName: 'Administrador',
      role: 'admin',
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    const voter: InternalUser = {
      id: 'voter-001',
      username: 'voter001',
      fullName: 'Votante Demo',
      role: 'voter',
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(admin.id, admin);
    this.users.set(voter.id, voter);
  }

  list(): UserDto[] {
    return [...this.users.values()].map(this.sanitize);
  }

  getById(id: string): UserDto {
    const u = this.users.get(id);
    if (!u) throw new NotFoundException('User not found');
    return this.sanitize(u);
  }

  getByUsername(username: string): UserDto | undefined {
    const found = [...this.users.values()].find(u => u.username === username);
    return found ? this.sanitize(found) : undefined;
  }

  create(payload: CreateUserRequestDto): UserDto {
    const exists = [...this.users.values()].some(u => u.username === payload.username);
    if (exists) throw new BadRequestException('Username already exists');

    const now = Date.now();
    const id = randomUUID();

    const user: InternalUser = {
      id,
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role as UserRole,
      enabled: payload.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, user);
    return this.sanitize(user);
  }

  update(id: string, payload: UpdateUserRequestDto): UserDto {
    const u = this.users.get(id);
    if (!u) throw new NotFoundException('User not found');

    const now = Date.now();
    const updated: InternalUser = {
      ...u,
      fullName: payload.fullName ?? u.fullName,
      role: payload.role ?? u.role,
      enabled: payload.enabled ?? u.enabled,
      updatedAt: now,
    };

    this.users.set(id, updated);
    return this.sanitize(updated);
  }

  setEnabled(id: string, enabled: boolean): UserDto {
    return this.update(id, { enabled });
  }

  eligibility(id: string): EligibilityResponseDto {
    const u = this.users.get(id);
    if (!u) return { id, eligible: false, reason: 'User not found' };
    if (!u.enabled) return { id, eligible: false, reason: 'User disabled' };
    if (u.role !== 'voter') return { id, eligible: false, reason: 'User is not voter' };
    return { id, eligible: true };
  }

  private sanitize(u: InternalUser): UserDto {
    // aquí eliminas campos sensibles si los agregas luego (passwordHash, etc)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = u;
    return safe;
  }
}
