import { IsNumber, IsDateString, IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateBidDto {
  @IsNumber()
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
