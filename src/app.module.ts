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

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        console.log('DATABASE_URL:', config.get('DATABASE_URL'));
        return {
          type: 'postgres',
          url: config.get('DATABASE_URL'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          ssl: {
            rejectUnauthorized: false,
          },
        };
      },
      inject: [ConfigService],
    }),
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
