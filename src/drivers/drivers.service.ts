// src/drivers/drivers.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Driver } from './entities/driver.entity';
import { User } from '../users/entities/user.entity';
import { Carrier } from '../users/entities/carrier.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { DriverResponseDto } from './dto/driver-response.dto';
import { UserService } from 'src/users/users.service';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { DriverStatus } from './enums/driver-status.enum';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private userService: UserService,
  ) {}

  async create(carrierId: number, createDriverDto: CreateDriverDto): Promise<DriverResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createDriverDto.email },
    });
    if (existingUser) throw new ConflictException('Email already registered');

    const carrier = await this.carrierRepository.findOne({
      where: { id: carrierId },
    });
    if (!carrier) throw new NotFoundException('Carrier not found');

    const driverRole = await this.roleRepository.findOne({
      where: { name: 'driver' },
    });
    if (!driverRole) throw new NotFoundException('Driver role not found');

    const user = this.userRepository.create({
      email: createDriverDto.email,
      password: await bcrypt.hash(createDriverDto.password, 10),
      role: driverRole,
      isActive: true,
    });

    const driver = this.driverRepository.create({
      ...createDriverDto,
      user,
      carrier,
    });

    const savedDriver = await this.driverRepository.save(driver);
    return new DriverResponseDto(savedDriver);
  }

  async findAll(carrierId: number): Promise<DriverResponseDto[]> {
    const drivers = await this.driverRepository.find({
      where: { carrier: { id: carrierId } },
      relations: ['user'],
    });
    return drivers.map(driver => new DriverResponseDto(driver));
  }

  async findAllPaginated(carrierId: number, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [drivers, total] = await this.driverRepository.findAndCount({
      where: { carrier: { id: carrierId } },
      relations: ['user'],
      skip,
      take: limit,
      order: {
        joinedAt: 'DESC',
      },
    });

    const items = drivers.map(driver => new DriverResponseDto(driver));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(carrierId: number, id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id, carrier: { id: carrierId } },
      relations: ['user'],
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async findOneAndFormat(carrierId: number, id: string): Promise<DriverResponseDto> {
    const driver = await this.findOne(carrierId, id);
    return new DriverResponseDto(driver);
  }

  async findAvailable(carrierId: number): Promise<DriverResponseDto[]> {
    const drivers = await this.driverRepository.find({
      where: {
        carrier: { id: carrierId },
        status: DriverStatus.AVAILABLE,
      },
      relations: ['user'],
    });
    return drivers.map(driver => new DriverResponseDto(driver));
  }

  async update(
    carrierId: number,
    id: string,
    updateDriverDto: UpdateDriverDto,
  ): Promise<DriverResponseDto> {
    const driver = await this.findOne(carrierId, id);

    if (updateDriverDto.email && updateDriverDto.email !== driver.user.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: updateDriverDto.email },
      });
      if (emailExists && emailExists.id !== driver.user.id) {
        throw new ConflictException('Email already registered');
      }
      driver.user.email = updateDriverDto.email;
    }

    if (updateDriverDto.password) {
      driver.user.password = await bcrypt.hash(updateDriverDto.password, 10);
    }

    Object.assign(driver, updateDriverDto);

    await this.userRepository.save(driver.user);
    const savedDriver = await this.driverRepository.save(driver);
    return new DriverResponseDto(savedDriver);
  }

  async updateStatus(
    carrierId: number,
    id: string,
    updateDriverStatusDto: UpdateDriverStatusDto,
  ): Promise<DriverResponseDto> {
    const driver = await this.findOne(carrierId, id);

    driver.status = updateDriverStatusDto.status;

    const savedDriver = await this.driverRepository.save(driver);
    return new DriverResponseDto(savedDriver);
  }

  async remove(carrierId: number, id: string): Promise<void> {
    const driver = await this.findOne(carrierId, id);
    const user = driver.user;
    await this.driverRepository.remove(driver);
    if (user) {
      await this.userRepository.remove(user);
    }
  }
}
