import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

export class RegisterDto {
  @ApiProperty({ description: 'User email', example: 'newuser@medportal.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    required: false,
    default: 'PATIENT',
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}