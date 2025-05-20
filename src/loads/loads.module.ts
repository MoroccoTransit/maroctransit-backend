import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Load } from './entities/load.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Load])],
  controllers: [],
  providers: [],
  exports: [],
})
export class LoadsModule {}
