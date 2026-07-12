import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['SUPER_ADMIN', 'ADMIN', 'SELLER', 'STUDENT'])
  @IsOptional()
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'SELLER' | 'STUDENT';
}
