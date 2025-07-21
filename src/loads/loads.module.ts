import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Load } from './entities/load.entity';
import { LoadsController } from './loads.controller';
import { LoadsService } from './loads.service';
import { Shipper } from 'src/users/entities/shipper.entity';
import { Bid } from 'src/bids/entities/bid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Load, Shipper, Bid])],
  controllers: [LoadsController],
  providers: [LoadsService],
  exports: [LoadsService],
})
export class LoadsModule {}
