import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Equal } from 'typeorm';
import { Bid } from './entities/bid.entity';
import { Load } from '../loads/entities/load.entity';
import { Carrier } from '../users/entities/carrier.entity';
import { Truck } from '../trucks/entities/truck.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidStatus } from './enums/bid-status.enum';
import { LoadStatus } from '../loads/enums/load-status.enum';
import { ShipmentsService } from '../shipments/shipments.service';

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Carrier)
    private readonly carrierRepository: Repository<Carrier>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @Inject(forwardRef(() => ShipmentsService))
    private readonly shipmentsService: ShipmentsService,
  ) {}

  async createBid(loadId: string, userId: number, createBidDto: CreateBidDto): Promise<Bid> {
    // Find the load
    const load = await this.loadRepository.findOne({
      where: { id: loadId, status: LoadStatus.PENDING },
    });
    if (!load) throw new NotFoundException('Load not found or not available for bidding');

    // Find the carrier
    const carrier = await this.carrierRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!carrier) throw new NotFoundException('Carrier not found');

    // Find the truck and verify it belongs to the carrier
    const truck = await this.truckRepository.findOne({
      where: { id: createBidDto.truckId, carrier: { id: carrier.id } },
    });
    if (!truck) throw new NotFoundException('Truck not found or does not belong to carrier');

    // Create and save the bid
    const bid = this.bidRepository.create({
      amount: createBidDto.amount,
      proposedPickupDate: createBidDto.proposedPickupDate,
      proposedDeliveryDate: createBidDto.proposedDeliveryDate,
      load,
      carrier,
      truck,
      status: BidStatus.PENDING,
    });
    return await this.bidRepository.save(bid);
  }

  async acceptBidByBidId(bidId: string, shipperId: number): Promise<Bid> {
    // Find the bid and load
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      relations: ['load', 'carrier', 'truck'], // Ensure all needed relations are loaded
    });
    if (!bid) throw new NotFoundException('Bid not found');
    const load = await this.loadRepository.findOne({
      where: { id: bid.load.id, shipper: { user: { id: shipperId } } },
    });
    if (!load) throw new NotFoundException('Load not found or not owned by shipper');

    // Reject all other bids
    await this.bidRepository.update(
      { load: { id: load.id }, id: Not(Equal(bidId)) },
      { status: BidStatus.REJECTED },
    );

    // Accept this bid and update load
    bid.status = BidStatus.ACCEPTED;
    load.status = LoadStatus.ACCEPTED;
    load.acceptedBidAmount = bid.amount;

    await this.loadRepository.save(load);
    await this.bidRepository.save(bid);

    // --- Shipment execution phase ---
    await this.shipmentsService.createShipmentFromBid(bid);

    return bid;
  }

  async getBidsForLoadPaginated(loadId: string, userId: number, page = 1, limit = 10) {
    // Find the shipper by userId
    const load = await this.loadRepository.findOne({
      where: { id: loadId, shipper: { user: { id: userId } } },
    });
    if (!load) throw new NotFoundException('Load not found or not owned by shipper');

    const [data, total] = await this.bidRepository.findAndCount({
      where: { load: { id: loadId } },
      relations: ['carrier', 'truck'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
