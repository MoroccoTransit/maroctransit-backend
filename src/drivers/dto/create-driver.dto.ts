import { IsEmail, IsString, MinLength, IsDateString } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class CreateDriverDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  cin: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  licenseNumber: string;

  @IsDateString()
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return value;
    try {
      if (value instanceof Date) {
        return value.toISOString();
      }
      const dateStr = String(value);
      return new Date(dateStr).toISOString();
    } catch {
      return value;
    }
  })
  licenseExpiryDate: string;
}
