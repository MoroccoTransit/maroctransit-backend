import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Truck } from './entities/truck.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Carrier } from 'src/users/entities/carrier.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { TruckResponseDto } from './dto/truck-response.dto';
import { TruckStatus } from './enums/truck-status.enum';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck)
    private truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async createTruck(
    createTruckDto: CreateTruckDto,
    carrier: Carrier,
    primaryImageUrl: string,
    imageUrls: string[],
  ): Promise<TruckResponseDto> {
    const truck = this.truckRepository.create({
      ...createTruckDto,
      carrier,
      status: createTruckDto.status || TruckStatus.AVAILABLE,
      primaryImage: primaryImageUrl,
      images: imageUrls,
    });

    const savedTruck = await this.truckRepository.save(truck);
    return new TruckResponseDto(savedTruck);
  }

  async findTrucksByCarrier(
    carrierId: number,
    paginationDto: PaginationDto,
    statusFilter?: TruckStatus[],
  ) {
    const whereCondition: any = { carrier: { id: carrierId } };

    // Add status filter if provided
    if (statusFilter && statusFilter.length > 0) {
      whereCondition.status = In(statusFilter);
    }

    const [trucks, total] = await this.truckRepository.findAndCount({
      where: whereCondition,
      skip: (paginationDto.page - 1) * paginationDto.limit,
      take: paginationDto.limit,
      order: {
        createdAt: 'DESC',
      },
      relations: {
        currentDriver: true,
      },
    });

    return {
      data: trucks.map(truck => new TruckResponseDto(truck)),
      meta: {
        total,
        page: paginationDto.page,
        limit: paginationDto.limit,
        totalPages: Math.ceil(total / paginationDto.limit),
        statusFilter: statusFilter || null,
      },
    };
  }

  async findOne(id: string, carrierId: number): Promise<TruckResponseDto> {
    const truck = await this.truckRepository.findOne({
      where: {
        id,
        carrier: { id: carrierId },
      },
      relations: ['carrier'],
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    return new TruckResponseDto(truck);
  }

  async delete(id: string, carrierId: number): Promise<void> {
    const truck = await this.truckRepository.findOne({
      where: {
        id,
        carrier: { id: carrierId },
      },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    await this.truckRepository.remove(truck);
  }

  async update(
    id: string,
    carrierId: number,
    updateTruckDto: UpdateTruckDto,
  ): Promise<TruckResponseDto> {
    const truck = await this.truckRepository.findOne({
      where: {
        id,
        carrier: { id: carrierId },
      },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    Object.assign(truck, updateTruckDto);

    const updatedTruck = await this.truckRepository.save(truck);
    return new TruckResponseDto(updatedTruck);
  }

  async assignDriver(
    truckId: string,
    driverId: string,
    carrierId: number,
  ): Promise<TruckResponseDto> {
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, carrier: { id: carrierId } },
      relations: ['currentDriver'],
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    if (truck.currentDriver) {
      throw new ConflictException('Truck already has an assigned driver');
    }

    const driver = await this.driverRepository.findOne({
      where: { id: driverId, carrier: { id: carrierId } },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Check if driver is already assigned to another truck
    const driverWithTruck = await this.driverRepository.findOne({
      where: { id: driverId },
      relations: ['assignedTruck'],
    });

    if (driverWithTruck?.assignedTruck) {
      throw new ConflictException('Driver is already assigned to another truck');
    }

    truck.currentDriver = driver;
    const savedTruck = await this.truckRepository.save(truck);

    driver.assignedTruck = savedTruck;
    await this.driverRepository.save(driver);

    const updatedTruck = await this.truckRepository.findOne({
      where: { id: truckId },
      relations: ['currentDriver', 'carrier'],
    });

    return new TruckResponseDto(updatedTruck);
  }

  async unassignDriver(truckId: string, carrierId: number): Promise<TruckResponseDto> {
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, carrier: { id: carrierId } },
      relations: ['currentDriver'],
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    if (!truck.currentDriver) {
      throw new ConflictException('Truck does not have an assigned driver');
    }

    const driver = await this.driverRepository.findOne({
      where: { id: truck.currentDriver.id },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    driver.assignedTruck = null;
    await this.driverRepository.save(driver);

    truck.currentDriver = null;
    const savedTruck = await this.truckRepository.save(truck);

    const updatedTruck = await this.truckRepository.findOne({
      where: { id: truckId },
      relations: ['carrier'],
    });

    return new TruckResponseDto(updatedTruck);
  }

  async updateTruckLocation(truckId: string, lat: number, lng: number) {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (!truck) throw new NotFoundException('Truck not found');
    truck.currentLocation = { lat, lng };
    await this.truckRepository.save(truck);
    return truck;
  }

  async isDriverAssignedToTruck(driverId: string, truckId: string): Promise<boolean> {
    const truck = await this.truckRepository.findOne({
      where: { id: truckId },
      relations: ['currentDriver'],
    });
    return !!(truck && truck.currentDriver && String(truck.currentDriver.id) === driverId);
  }

  async findDriverByUserId(userId: number) {
    return this.driverRepository.findOne({ where: { user: { id: userId } } });
  }

  async updateTruckStatus(
    truckId: string,
    carrierId: number,
    newStatus: TruckStatus,
  ): Promise<TruckResponseDto> {
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, carrier: { id: carrierId } },
      relations: ['currentDriver'],
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    truck.status = newStatus;
    const savedTruck = await this.truckRepository.save(truck);

    return new TruckResponseDto(savedTruck);
  }
}
