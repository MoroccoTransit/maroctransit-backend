import { IsEnum, IsNumber, IsNotEmpty, IsDateString } from 'class-validator';
import { TruckType } from '../enums/truck-type.enum';

export class CreateTruckDto {
  @IsNotEmpty()
  licensePlate: string;

  @IsEnum(TruckType)
  type: TruckType;

  @IsNumber()
  capacity: number;

  @IsNotEmpty()
  carteGriseNumber: string;

  @IsDateString()
  insuranceExpiryDate: Date;
}
