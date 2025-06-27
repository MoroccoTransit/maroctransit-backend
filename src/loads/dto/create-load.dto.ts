import { ValidateNested, IsDateString, IsNumber, Min, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './location.dto';
import { DimensionsDto } from './dimensions.dto';

export class CreateLoadDto {
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @IsNumber()
  @Min(0)
  weight: number;

  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions: DimensionsDto;

  @IsDateString()
  pickupDate: string;

  @IsDateString()
  deliveryDeadline: string;

  @IsNumber()
  @Min(0)
  budget: number;

  @IsString()
  @IsOptional()
  description?: string;
}
