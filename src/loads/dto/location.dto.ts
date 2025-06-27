import { IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CoordinatesDto } from './coordinates.dto';

export class LocationDto {
  @IsString()
  address: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsObject()
  coordinates: CoordinatesDto;
}
