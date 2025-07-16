import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentsService } from './shipments.service';
import { Load } from '../loads/entities/load.entity';
import { Carrier } from '../users/entities/carrier.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Truck } from '../trucks/entities/truck.entity';
import { Bid } from '../bids/entities/bid.entity';
import { ShipmentsController } from './shipments.controller';
import { ShipmentTasksService } from './shipment-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, Load, Carrier, Driver, Truck, Bid])],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentTasksService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
