import { IsOptional, IsEnum, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { TruckStatus } from '../enums/truck-status.enum';

export class TruckFilterDto {
  @IsOptional()
  @IsArray()
  @IsEnum(TruckStatus, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(status => status.trim());
    }
    return value;
  })
  status?: TruckStatus[];
}
