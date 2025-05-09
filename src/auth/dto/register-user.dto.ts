import { IsEmail, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsIn(['admin', 'carrier', 'shipper'])
  roleName: string;
}
