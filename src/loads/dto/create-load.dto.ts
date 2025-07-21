import {
  ValidateNested,
  IsDateString,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './location.dto';
import { DimensionsDto } from './dimensions.dto';
import { CargoType } from '../enums/cargo-type.enum';
import { WeightUnit } from '../enums/weight-unit.enum';

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

  @IsEnum(WeightUnit)
  @IsOptional()
  weightUnit?: WeightUnit;

  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions: DimensionsDto;

  @IsArray()
  @IsEnum(CargoType, { each: true })
  cargoTypes: CargoType[];

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
