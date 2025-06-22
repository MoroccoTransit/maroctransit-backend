import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { RoleInitializationService } from './intialization/role-intialization.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [RolesService, RoleInitializationService],
  exports: [RolesService],
})
export class RolesModule {}
