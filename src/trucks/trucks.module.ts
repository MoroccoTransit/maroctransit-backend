import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Truck } from './entities/truck.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Truck])],
  controllers: [],
  providers: [],
  exports: [],
})
export class TrucksModule {}
