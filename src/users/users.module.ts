import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './users.service';
import { RolesModule } from '../roles/roles.module';
import { Carrier } from './entities/carrier.entity';
import { Shipper } from './entities/shipper.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { CarrierService } from './carrier.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Carrier, Shipper, PasswordResetToken]), RolesModule],
  controllers: [],
  providers: [UserService, CarrierService],
  exports: [UserService, CarrierService],
})
export class UsersModule {}
