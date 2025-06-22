import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleInitializationService implements OnModuleInit {
  private readonly logger = new Logger(RoleInitializationService.name);
  private readonly defaultRoles = ['admin', 'shipper', 'carrier', 'driver'];

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.initializeRoles();
  }

  private async initializeRoles() {
    try {
      for (const roleName of this.defaultRoles) {
        const exists = await this.roleRepository.findOneBy({ name: roleName });
        if (!exists) {
          const newRole = this.roleRepository.create({ name: roleName });
          await this.roleRepository.save(newRole);
          this.logger.log(`Created role: ${roleName}`);
        }
      }
      this.logger.log('Roles initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize roles', error.stack);
    }
  }
}
