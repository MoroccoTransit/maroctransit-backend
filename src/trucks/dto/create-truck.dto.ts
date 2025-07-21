import { IsEnum, IsNumber, IsNotEmpty, IsISO8601, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TruckType } from '../enums/truck-type.enum';
import { TruckStatus } from '../enums/truck-status.enum';

export class CreateTruckDto {
  @IsNotEmpty()
  licensePlate: string;

  @IsEnum(TruckType)
  type: TruckType;

  @IsNumber()
  @Type(() => Number)
  capacity: number;

  @IsNotEmpty()
  carteGriseNumber: string;

  @IsISO8601()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value;
    }
    return value;
  })
  insuranceExpiryDate: string;

  @IsOptional()
  @IsEnum(TruckStatus)
  status?: TruckStatus;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  currentLocation?: { lat: number; lng: number };
}
