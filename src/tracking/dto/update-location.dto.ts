import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  shipmentId: string;

  @IsString()
  truckId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
