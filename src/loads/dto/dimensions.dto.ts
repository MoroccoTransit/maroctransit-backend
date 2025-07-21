import { IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { DimensionUnit } from '../enums/dimension-unit.enum';

export class DimensionsDto {
  @IsNumber()
  @Min(0)
  length: number;

  @IsNumber()
  @Min(0)
  width: number;

  @IsNumber()
  @Min(0)
  height: number;

  @IsEnum(DimensionUnit)
  @IsOptional()
  unit?: DimensionUnit;
}
