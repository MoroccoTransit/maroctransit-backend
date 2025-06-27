import { IsIn, IsString } from 'class-validator';
import { BaseRegisterDto } from './create-user.dto';

export class ShipperRegisterDto extends BaseRegisterDto {
  @IsString()
  businessName: string;

  @IsString()
  taxId: string;

  @IsString()
  emergencyContact: string;
}
