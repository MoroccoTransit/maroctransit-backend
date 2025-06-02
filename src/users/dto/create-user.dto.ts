import { IsEmail, IsString, IsPhoneNumber } from 'class-validator';

export class BaseRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsPhoneNumber('MA')
  phoneNumber: string;

  @IsString()
  address: string;
}
