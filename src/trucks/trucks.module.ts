import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Truck } from './entities/truck.entity';
import { TrucksService } from './trucks.service';
import { TrucksController } from './trucks.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { FileUploadModule } from 'src/shared/file-upload/file-upload.module';
import { Driver } from 'src/drivers/entities/driver.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Truck, Driver]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    FileUploadModule,
  ],
  controllers: [TrucksController],
  providers: [TrucksService],
  exports: [],
})
export class TrucksModule {}
