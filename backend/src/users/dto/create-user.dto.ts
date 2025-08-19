import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from './update-user.dto';

export class CreateUserDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, required: false, default: 'PATIENT' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}


