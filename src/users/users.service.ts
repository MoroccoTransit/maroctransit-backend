import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Carrier } from './entities/carrier.entity';
import { Shipper } from './entities/shipper.entity';
import { CarrierRegisterDto } from './dto/create-carrier.dto';
import { ShipperRegisterDto } from './dto/create-shipper.dto';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
    @InjectRepository(Shipper)
    private shipperRepository: Repository<Shipper>,
    private roleService: RolesService,
  ) {}

  async registerCarrier(
    carrierDto: CarrierRegisterDto,
    filePaths: {
      vehicleRegistrationPath: string;
      insuranceDocPath: string;
      driverLicensePath: string;
    },
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email: carrierDto.email } });
    if (existingUser) throw new ConflictException('Email already registered');

    const role = await this.roleService.findByName('carrier');
    if (!role) throw new NotFoundException('Carrier role not found');

    const user = this.userRepository.create({
      ...carrierDto,
      password: await bcrypt.hash(carrierDto.password, 10),
      role,
      isActive: false,
    });

    return this.userRepository.manager.transaction(async manager => {
      const savedUser = await manager.save(user);
      const carrier = this.carrierRepository.create({
        ...carrierDto,
        ...filePaths,
        user: savedUser,
      });
      await manager.save(carrier);
      return savedUser;
    });
  }

  async registerShipper(
    shipperDto: ShipperRegisterDto,
    filePaths: {
      companyRegistrationDocPath: string;
    },
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email: shipperDto.email } });
    if (existingUser) throw new ConflictException('Email already registered');

    const role = await this.roleService.findByName('shipper');
    if (!role) throw new NotFoundException('Shipper role not found');

    const user = this.userRepository.create({
      ...shipperDto,
      password: await bcrypt.hash(shipperDto.password, 10),
      role,
      isActive: false,
    });

    return this.userRepository.manager.transaction(async manager => {
      const savedUser = await manager.save(user);
      const shipper = this.shipperRepository.create({
        ...shipperDto,
        ...filePaths,
        user: savedUser,
      });
      await manager.save(shipper);
      return savedUser;
    });
  }

  async activateUser(userId: number): Promise<void> {
    await this.userRepository.update(userId, { isActive: true });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }
}
