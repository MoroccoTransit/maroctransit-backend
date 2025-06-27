import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { Bid } from './entities/bid.entity';
import { Load } from '../loads/entities/load.entity';
import { Carrier } from '../users/entities/carrier.entity';
import { Truck } from '../trucks/entities/truck.entity';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, Load, Carrier, Truck]),
    forwardRef(() => ShipmentsModule),
  ],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
