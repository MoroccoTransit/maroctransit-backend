import { IsOptional, IsUUID, IsNumber, IsDateString, IsString, Min } from 'class-validator';

export class UpdateBidDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsUUID()
  truckId?: string;

  @IsOptional()
  @IsDateString()
  proposedPickupDate?: string;

  @IsOptional()
  @IsDateString()
  proposedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
