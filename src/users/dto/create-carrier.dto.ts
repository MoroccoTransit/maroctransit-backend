import { IsIn, IsString } from 'class-validator';
import { BaseRegisterDto } from './create-user.dto';

export class CarrierRegisterDto extends BaseRegisterDto {
  @IsIn(['carrier'])
  role: 'carrier';

  @IsString()
  companyName: string;

  @IsString()
  vehicleType: string;

  @IsString()
  maxLoadCapacity: string;

  @IsString({ each: true })
  certifications: string[];

  @IsString()
  serviceAreas: string;

  @IsString()
  availabilitySchedule: string;
}
