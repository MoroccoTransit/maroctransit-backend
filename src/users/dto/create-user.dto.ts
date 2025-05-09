import { IsEmail, IsString, IsIn, IsNotEmpty } from 'class-validator';
import { Role } from '../../roles/entities/role.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsIn(['admin', 'carrier', 'shipper'], {
    message: 'Role must be either admin, carrier, or shipper',
  })
  @IsNotEmpty()
  roleName: string;

  // This is not part of the input, but will be populated by the service
  role?: Role;
}
