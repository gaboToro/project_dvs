import { BadRequestException, Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import type { CreateUserRequestDto, EligibilityResponseDto, UpdateUserRequestDto, UserDto, UserRole } from '@org/contracts';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { query } from './db/postgres';

type UserRow = {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  enabled: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  password_hash: string | null;
};

@Injectable()
export class UsersService implements OnModuleInit {
  async onModuleInit() {
    if (process.env.SEED_DEFAULT_USERS === 'true') {
      await this.seedIfEmpty();
    }
  }

  async list(): Promise<UserDto[]> {
    const rows = await query<UserRow>(
      'SELECT id, username, full_name, role, enabled, created_at, updated_at FROM users ORDER BY created_at DESC',
    );
    return rows.map((row) => this.mapRow(row));
  }

  async getById(id: string): Promise<UserDto> {
    const rows = await query<UserRow>(
      'SELECT id, username, full_name, role, enabled, created_at, updated_at FROM users WHERE id = $1',
      [id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('User not found');
    return this.mapRow(row);
  }

  async getByUsername(username: string): Promise<UserDto | undefined> {
    const rows = await query<UserRow>(
      'SELECT id, username, full_name, role, enabled, created_at, updated_at FROM users WHERE username = $1',
      [username],
    );
    const row = rows[0];
    return row ? this.mapRow(row) : undefined;
  }

  async create(payload: CreateUserRequestDto): Promise<UserDto> {
    const existing = await query<UserRow>('SELECT id FROM users WHERE username = $1', [payload.username]);
    if (existing.length > 0) throw new BadRequestException('Username already exists');

    const passwordHash = this.hashPassword(payload.password);

    const rows = await query<UserRow>(
      `INSERT INTO users (username, full_name, role, enabled, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, full_name, role, enabled, created_at, updated_at`,
      [payload.username, payload.fullName, payload.role, payload.enabled ?? true, passwordHash],
    );
    const row = rows[0];
    if (!row) throw new BadRequestException('User not created');
    return this.mapRow(row);
  }

  async update(id: string, payload: UpdateUserRequestDto): Promise<UserDto> {
    const rows = await query<UserRow>(
      `UPDATE users
       SET full_name = COALESCE($2, full_name),
           role = COALESCE($3, role),
           enabled = COALESCE($4, enabled),
           updated_at = now()
       WHERE id = $1
       RETURNING id, username, full_name, role, enabled, created_at, updated_at`,
      [
        id,
        payload.fullName ?? null,
        payload.role ?? null,
        payload.enabled ?? null,
      ],
    );

    const row = rows[0];
    if (!row) throw new NotFoundException('User not found');
    return this.mapRow(row);
  }

  async setEnabled(id: string, enabled: boolean): Promise<UserDto> {
    return this.update(id, { enabled });
  }

  async eligibility(id: string): Promise<EligibilityResponseDto> {
    const rows = await query<UserRow>('SELECT id, role, enabled FROM users WHERE id = $1', [id]);
    const row = rows[0];
    if (!row) return { id, eligible: false, reason: 'User not found' };
    if (!row.enabled) return { id, eligible: false, reason: 'User disabled' };
    if (row.role !== 'voter') return { id, eligible: false, reason: 'User is not voter' };
    return { id, eligible: true };
  }

  async validateCredentials(username: string, password: string): Promise<UserDto> {
    const rows = await query<UserRow>('SELECT * FROM users WHERE username = $1', [username]);
    const row = rows[0];
    if (!row?.password_hash) throw new UnauthorizedException('Invalid credentials');
    if (!this.verifyPassword(password, row.password_hash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!row.enabled) {
      throw new UnauthorizedException('User disabled');
    }
    return this.mapRow(row);
  }

  private async seedIfEmpty(): Promise<void> {
    const rows = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
    const count = Number(rows[0]?.count ?? '0');
    if (count > 0) return;

    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
    const voterPassword = process.env.VOTER_PASSWORD ?? 'voter123';

    await query(
      `INSERT INTO users (username, full_name, role, enabled, password_hash)
       VALUES
         ($1, $2, 'admin', true, $3),
         ($4, $5, 'voter', true, $6)`,
      [
        'admin',
        'Administrador',
        this.hashPassword(adminPassword),
        'voter',
        'Votante Demo',
        this.hashPassword(voterPassword),
      ],
    );
  }

  private mapRow(row: UserRow): UserDto {
    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      enabled: row.enabled,
      createdAt: this.toMillis(row.created_at),
      updatedAt: this.toMillis(row.updated_at),
    };
  }

  private toMillis(value: Date | string): number {
    if (value instanceof Date) return value.getTime();
    return new Date(value).getTime();
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    const candidate = scryptSync(password, salt, 64);
    return timingSafeEqual(hash, candidate);
  }
}
