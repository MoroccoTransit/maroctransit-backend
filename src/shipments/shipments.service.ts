import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { Load } from '../loads/entities/load.entity';
import { Carrier } from '../users/entities/carrier.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Truck } from '../trucks/entities/truck.entity';
import { Bid } from '../bids/entities/bid.entity';
import { ShipmentStatus } from './enums/shipment-status.enum';
import { BidStatus } from 'src/bids/enums/bid-status.enum';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Carrier)
    private readonly carrierRepository: Repository<Carrier>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
  ) {}

  async createShipmentFromBid(bid: Bid): Promise<Shipment> {
    console.log('Creating shipment from bid:', bid);
    const load = await this.loadRepository.findOne({ where: { id: bid.load.id } });
    if (!load) throw new Error('Load not found');
    const carrier = await this.carrierRepository.findOne({ where: { id: bid.carrier.id } });
    if (!carrier) throw new Error('Carrier not found');
    const truck = await this.truckRepository.findOne({ where: { id: bid.truck.id } });
    if (!truck) throw new Error('Truck not found');
    // Optionally assign a driver here if needed
    const shipment = this.shipmentRepository.create({
      load,
      carrier,
      truck,
      bid,
      status: ShipmentStatus.SCHEDULED,
      startDate: bid.proposedPickupDate,
      estimatedDeliveryDate: bid.proposedDeliveryDate,
    });
    return this.shipmentRepository.save(shipment);
  }

  async assignDriver(shipmentId: string, driverId: string, carrierUserId: number) {
    // Find the shipment and ensure it belongs to the carrier
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['carrier', 'carrier.user', 'driver'],
    });
    if (!shipment) throw new Error('Shipment not found');
    // Find the carrier by userId
    if (!shipment.carrier) throw new Error('Shipment has no carrier');
    if (shipment.carrier.user.id !== carrierUserId)
      throw new Error('Unauthorized: Carrier does not own this shipment');
    // Find the driver and ensure it belongs to the carrier
    const driver = await this.driverRepository.findOne({
      where: { id: driverId, carrier: { id: shipment.carrier.id } },
    });
    if (!driver) throw new Error('Driver not found or does not belong to carrier');
    shipment.driver = driver;
    return this.shipmentRepository.save(shipment);
  }

  async findAllPaginated(shipperUserId: number, page = 1, limit = 10) {
    const [data, total] = await this.shipmentRepository.findAndCount({
      where: { load: { shipper: { user: { id: shipperUserId } } } },
      relations: {
        driver: { user: true },
        truck: true,
        load: true,
        carrier: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }
  async findShipmentsForCarrierAcceptedBids(carrierUserId: number, page = 1, limit = 10) {
    const acceptedBids = await this.bidRepository.find({
      where: {
        carrier: { user: { id: carrierUserId } },
        status: BidStatus.ACCEPTED,
      },
      relations: { load: true },
    });

    const loadIds = acceptedBids.map(bid => bid.load.id);

    if (loadIds.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    const [data, total] = await this.shipmentRepository.findAndCount({
      where: { load: { id: In(loadIds) } },
      relations: {
        driver: { user: true },
        truck: true,
        load: true,
        carrier: { user: true },
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async startShipment(shipmentId: string, userId: number) {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['driver', 'driver.user'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (!shipment.driver || shipment.driver.user.id !== userId) {
      throw new ForbiddenException('You must be the assigned driver to start this shipment');
    }

    if (shipment.status !== ShipmentStatus.SCHEDULED) {
      throw new BadRequestException(
        `Shipment must be in SCHEDULED status to start. Current status: ${shipment.status}`,
      );
    }

    shipment.status = ShipmentStatus.IN_TRANSIT;
    shipment.actualStartDate = new Date();
    return this.shipmentRepository.save(shipment);
  }

  async markAsDelivered(shipmentId: string, userId: number) {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['driver', 'driver.user', 'load'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (!shipment.driver || shipment.driver.user.id !== userId) {
      throw new ForbiddenException('Only assigned driver can mark shipment as delivered');
    }

    const allowedStatuses = [
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.DELAYED,
      ShipmentStatus.SCHEDULED,
    ];

    if (!allowedStatuses.includes(shipment.status)) {
      throw new BadRequestException(
        `Cannot mark shipment as delivered from current status: ${shipment.status}`,
      );
    }

    shipment.status = ShipmentStatus.DELIVERED;
    shipment.actualDeliveryDate = new Date();

    const result = await this.shipmentRepository.save(shipment);

    return result;
  }
}
