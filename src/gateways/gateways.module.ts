import { Module } from '@nestjs/common';
import { TrucksModule } from '../trucks/trucks.module';
import { TruckGateway } from './truck.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    TrucksModule,
    AuthModule,
  ],
  providers: [TruckGateway],
  exports: [],
})
export class GatewaysModule {}
