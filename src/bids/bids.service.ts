import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Equal, Between } from 'typeorm';
import { Bid } from './entities/bid.entity';
import { Load } from '../loads/entities/load.entity';
import { Carrier } from '../users/entities/carrier.entity';
import { Truck } from '../trucks/entities/truck.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { BidFilterDto } from './dto/bid-filter.dto';
import { BidStatus } from './enums/bid-status.enum';
import { LoadStatus } from '../loads/enums/load-status.enum';
import { TruckStatus } from '../trucks/enums/truck-status.enum';
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
    const load = await this.loadRepository.findOne({
      where: { id: loadId, status: LoadStatus.PUBLISHED },
    });
    if (!load) throw new NotFoundException('Load not found or not available for bidding');

    const carrier = await this.carrierRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!carrier) throw new NotFoundException('Carrier not found');

    const truck = await this.truckRepository.findOne({
      where: { id: createBidDto.truckId, carrier: { id: carrier.id } },
    });
    if (!truck) throw new NotFoundException('Truck not found or does not belong to carrier');

    await this.validateTruckAvailability(
      truck,
      new Date(createBidDto.proposedPickupDate),
      new Date(createBidDto.proposedDeliveryDate),
    );

    const existingBid = await this.bidRepository.findOne({
      where: { load: { id: loadId }, carrier: { id: carrier.id } },
    });
    if (existingBid) {
      throw new ConflictException('Carrier has already placed a bid for this load');
    }

    const pickupDate = new Date(createBidDto.proposedPickupDate);
    const deliveryDate = new Date(createBidDto.proposedDeliveryDate);
    if (pickupDate >= deliveryDate) {
      throw new BadRequestException('Pickup date must be before delivery date');
    }
    if (pickupDate <= new Date()) {
      throw new BadRequestException('Pickup date must be in the future');
    }

    const bid = this.bidRepository.create({
      amount: createBidDto.amount,
      proposedPickupDate: createBidDto.proposedPickupDate,
      proposedDeliveryDate: createBidDto.proposedDeliveryDate,
      load,
      carrier,
      truck,
      status: BidStatus.PENDING,
    });

    const savedBid = await this.bidRepository.save(bid);

    await this.addTruckCommitment(truck, savedBid, pickupDate, deliveryDate);

    return savedBid;
  }

  async acceptBidByBidId(bidId: string, shipperId: number): Promise<Bid> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      relations: ['load', 'carrier', 'truck'],
    });
    if (!bid) throw new NotFoundException('Bid not found');
    const load = await this.loadRepository.findOne({
      where: { id: bid.load.id, shipper: { user: { id: shipperId } } },
    });
    if (!load) throw new NotFoundException('Load not found or not owned by shipper');

    const otherBids = await this.bidRepository.find({
      where: { load: { id: load.id }, id: Not(Equal(bidId)) },
      relations: ['truck'],
    });

    for (const otherBid of otherBids) {
      await this.removeTruckCommitment(otherBid.truck, otherBid.id);
    }

    await this.bidRepository.update(
      { load: { id: load.id }, id: Not(Equal(bidId)) },
      { status: BidStatus.REJECTED },
    );

    bid.status = BidStatus.ACCEPTED;
    load.status = LoadStatus.ACCEPTED;
    load.acceptedBidAmount = bid.amount;
    load.acceptedBid = bid;

    await this.loadRepository.save(load);
    await this.bidRepository.save(bid);

    await this.shipmentsService.createShipmentFromBid(bid);

    return bid;
  }

  async getBidsForLoadPaginated(loadId: string, userId: number, page = 1, limit = 10) {
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

  async getCarrierBidsByUserId(userId: number, page = 1, limit = 10, filters?: BidFilterDto) {
    const carrier = await this.carrierRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!carrier) throw new NotFoundException('Carrier not found');

    const where: any = { carrier: { id: carrier.id } };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    const [data, total] = await this.bidRepository.findAndCount({
      where,
      relations: ['load', 'truck'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async updateBid(bidId: string, userId: number, updateBidDto: UpdateBidDto): Promise<Bid> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId, carrier: { user: { id: userId } } },
      relations: ['load', 'carrier', 'truck'],
    });

    if (!bid) {
      throw new NotFoundException('Bid not found or not owned by carrier');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Only pending bids can be updated');
    }

    let pickupDate = new Date(bid.proposedPickupDate);
    let deliveryDate = new Date(bid.proposedDeliveryDate);
    let truckChanged = false;

    if (updateBidDto.proposedPickupDate || updateBidDto.proposedDeliveryDate) {
      const newPickupDate = updateBidDto.proposedPickupDate
        ? new Date(updateBidDto.proposedPickupDate)
        : pickupDate;
      const newDeliveryDate = updateBidDto.proposedDeliveryDate
        ? new Date(updateBidDto.proposedDeliveryDate)
        : deliveryDate;

      if (newPickupDate >= newDeliveryDate) {
        throw new BadRequestException('Pickup date must be before delivery date');
      }
      if (newPickupDate <= new Date()) {
        throw new BadRequestException('Pickup date must be in the future');
      }

      pickupDate = newPickupDate;
      deliveryDate = newDeliveryDate;

      if (updateBidDto.proposedPickupDate) {
        bid.proposedPickupDate = new Date(updateBidDto.proposedPickupDate);
      }
      if (updateBidDto.proposedDeliveryDate) {
        bid.proposedDeliveryDate = new Date(updateBidDto.proposedDeliveryDate);
      }
    }

    if (updateBidDto.truckId && updateBidDto.truckId !== bid.truck.id) {
      const newTruck = await this.truckRepository.findOne({
        where: { id: updateBidDto.truckId, carrier: { id: bid.carrier.id } },
      });

      if (!newTruck) {
        throw new NotFoundException('Truck not found or does not belong to carrier');
      }

      await this.validateTruckAvailability(newTruck, pickupDate, deliveryDate);

      await this.removeTruckCommitment(bid.truck, bid.id);

      bid.truck = newTruck;
      truckChanged = true;
    }

    if ((updateBidDto.proposedPickupDate || updateBidDto.proposedDeliveryDate) && !truckChanged) {
      await this.removeTruckCommitment(bid.truck, bid.id);

      await this.validateTruckAvailability(bid.truck, pickupDate, deliveryDate);
    }

    if (updateBidDto.amount !== undefined) {
      bid.amount = updateBidDto.amount;
    }

    if (updateBidDto.notes !== undefined) {
      bid.notes = updateBidDto.notes;
    }

    const savedBid = await this.bidRepository.save(bid);

    await this.addTruckCommitment(bid.truck, savedBid, pickupDate, deliveryDate);

    return savedBid;
  }

  async cancelBid(bidId: string, userId: number): Promise<Bid> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId, carrier: { user: { id: userId } } },
      relations: ['truck', 'load', 'carrier'],
    });

    if (!bid) {
      throw new NotFoundException('Bid not found or not owned by carrier');
    }

    if (bid.status === BidStatus.CANCELLED) {
      throw new BadRequestException('Bid is already cancelled');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Only pending bids can be cancelled');
    }

    bid.status = BidStatus.CANCELLED;
    const savedBid = await this.bidRepository.save(bid);

    await this.removeTruckCommitment(bid.truck, bidId);

    return savedBid;
  }

  private async validateTruckAvailability(
    truck: Truck,
    pickupDate: Date,
    deliveryDate: Date,
  ): Promise<void> {
    if (
      truck.status === TruckStatus.OUT_OF_SERVICE ||
      truck.status === TruckStatus.IN_MAINTENANCE
    ) {
      throw new BadRequestException('Truck is not available for new commitments');
    }

    // Check for overlapping commitments
    if (truck.commitments && truck.commitments.length > 0) {
      const hasOverlap = truck.commitments.some(commitment => {
        const commitmentStart = new Date(commitment.start);
        const commitmentEnd = new Date(commitment.end);

        // Two date ranges overlap if:
        // 1. New start is between existing start and end (starts during existing)
        // 2. New end is between existing start and end (ends during existing)
        // 3. New range completely encompasses existing range
        // 4. Existing range completely encompasses new range
        const newStartsDuring = pickupDate >= commitmentStart && pickupDate < commitmentEnd;
        const newEndsDuring = deliveryDate > commitmentStart && deliveryDate <= commitmentEnd;
        const newEncompasses = pickupDate <= commitmentStart && deliveryDate >= commitmentEnd;
        const existingEncompasses = commitmentStart <= pickupDate && commitmentEnd >= deliveryDate;

        return newStartsDuring || newEndsDuring || newEncompasses || existingEncompasses;
      });

      if (hasOverlap) {
        throw new ConflictException('Truck has conflicting commitments for the proposed dates');
      }
    }
  }

  private async addTruckCommitment(
    truck: Truck,
    bid: Bid,
    pickupDate: Date,
    deliveryDate: Date,
  ): Promise<void> {
    if (!truck.commitments) {
      truck.commitments = [];
    }

    const commitment = {
      start: pickupDate,
      end: deliveryDate,
      loadId: bid.load.id,
      bidId: bid.id,
    };

    truck.commitments.push(commitment);
    await this.truckRepository.save(truck);
  }

  private async removeTruckCommitment(truck: Truck, bidId: string): Promise<void> {
    if (!truck.commitments || truck.commitments.length === 0) {
      return;
    }

    truck.commitments = truck.commitments.filter(commitment => commitment.bidId !== bidId);

    await this.truckRepository.save(truck);
  }
}
