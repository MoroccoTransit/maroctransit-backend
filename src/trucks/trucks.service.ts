import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from './entities/truck.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Carrier } from 'src/users/entities/carrier.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { TruckResponseDto } from './dto/truck-response.dto';
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
      isAvailable: true,
      primaryImage: primaryImageUrl,
      images: imageUrls,
    });

    const savedTruck = await this.truckRepository.save(truck);
    return new TruckResponseDto(savedTruck);
  }

  async findTrucksByCarrier(carrierId: number, paginationDto: PaginationDto) {
    const [trucks, total] = await this.truckRepository.findAndCount({
      where: { carrier: { id: carrierId } },
      skip: (paginationDto.page - 1) * paginationDto.limit,
      take: paginationDto.limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      data: trucks.map(truck => new TruckResponseDto(truck)),
      meta: {
        total,
        page: paginationDto.page,
        limit: paginationDto.limit,
        totalPages: Math.ceil(total / paginationDto.limit),
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
    truck.isAvailable = false;

    const savedTruck = await this.truckRepository.save(truck);

    // Update driver's availability
    driver.isAvailable = false;
    driver.assignedTruck = savedTruck;
    await this.driverRepository.save(driver);

    // Fetch the updated truck with all relations
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

    // Update driver's availability and remove truck assignment
    driver.isAvailable = true;
    driver.assignedTruck = null;
    await this.driverRepository.save(driver);

    // Update truck's availability and remove driver assignment
    truck.currentDriver = null;
    truck.isAvailable = true;
    const savedTruck = await this.truckRepository.save(truck);

    // Fetch the updated truck with all relations
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
}
