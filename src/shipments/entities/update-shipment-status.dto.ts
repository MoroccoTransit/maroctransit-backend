import { IsEnum } from 'class-validator';
import { ShipmentStatus } from '../enums/shipment-status.enum';

export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;
}
