import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { BidStatus } from '../enums/bid-status.enum';

export class BidFilterDto {
  @IsOptional()
  @IsEnum(BidStatus)
  status?: BidStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
