import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { Load } from '../loads/entities/load.entity';
import { Carrier } from '../users/entities/carrier.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Truck } from '../trucks/entities/truck.entity';
import { Bid } from '../bids/entities/bid.entity';
import { ShipmentStatus } from './enums/shipment-status.enum';

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
}
