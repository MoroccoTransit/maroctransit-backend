import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { DriversModule } from './drivers/drivers.module';
import { TrucksModule } from './trucks/trucks.module';
import { Load } from './loads/entities/load.entity';
import { LoadsModule } from './loads/loads.module';
import { BidsModule } from './bids/bids.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { GatewaysModule } from './gateways/gateways.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    DriversModule,
    TrucksModule,
    LoadsModule,
    BidsModule,
    ShipmentsModule,
    GatewaysModule,
  ],
})
export class AppModule {}
