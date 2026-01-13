import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export type UserRole = 'admin' | 'voter';

export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export class CreateUserRequestDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsIn(['admin', 'voter'])
  role!: UserRole;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateUserRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  fullName?: string;

  @IsOptional()
  @IsIn(['admin', 'voter'])
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export interface EligibilityResponseDto {
  id: string;
  eligible: boolean;
  reason?: string;
}
