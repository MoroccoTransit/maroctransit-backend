import { IsIn, IsString, IsDateString } from 'class-validator';
import { BaseRegisterDto } from './create-user.dto';

export class CarrierRegisterDto extends BaseRegisterDto {
  @IsIn(['carrier'])
  role: 'carrier';

  @IsString()
  companyName: string;

  @IsString()
  ice: string;

  @IsString()
  rcNumber: string;

  @IsDateString()
  insuranceExpiryDate: Date;

  @IsString()
  transportLicenseNumber: string;

  @IsString()
  availabilitySchedule: string;

  @IsString()
  insurancePolicyNumber: string;
}
