import { IsNumber, IsDateString, IsUUID, IsString, IsOptional, Min } from 'class-validator';

export class CreateBidDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  proposedPickupDate: string;

  @IsDateString()
  proposedDeliveryDate: string;

  @IsUUID()
  truckId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
