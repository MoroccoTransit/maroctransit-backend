import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Load } from './entities/load.entity';
import { Shipper } from '../users/entities/shipper.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { LoadResponseDto } from './dto/load-response.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { LoadStatus } from './enums/load-status.enum';
import { BidStatus } from '../bids/enums/bid-status.enum';
import { DimensionUnit } from './enums/dimension-unit.enum';
import { WeightUnit } from './enums/weight-unit.enum';

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Shipper)
    private readonly shipperRepository: Repository<Shipper>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
  ) {}

  // =============================================
  // CREATE OPERATIONS
  // =============================================

  async createLoad(createLoadDto: CreateLoadDto, userId: number): Promise<LoadResponseDto> {
    const shipper = await this.getShipperByUserId(userId);

    const load = this.loadRepository.create({
      origin: createLoadDto.origin,
      destination: createLoadDto.destination,
      weight: createLoadDto.weight,
      weightUnit: createLoadDto.weightUnit || WeightUnit.KILOGRAM,
      dimensions: {
        ...createLoadDto.dimensions,
        unit: createLoadDto.dimensions.unit || DimensionUnit.METERS,
      },
      cargoTypes: createLoadDto.cargoTypes,
      status: LoadStatus.DRAFT,
      pickupDate: new Date(createLoadDto.pickupDate),
      deliveryDeadline: new Date(createLoadDto.deliveryDeadline),
      budget: createLoadDto.budget,
      description: createLoadDto.description,
      shipper,
    });

    const savedLoad = await this.loadRepository.save(load);
    return new LoadResponseDto(savedLoad);
  }

  // =============================================
  // READ OPERATIONS
  // =============================================

  async findShipperLoads(userId: number, paginationDto: PaginationDto) {
    const shipper = await this.getShipperByUserId(userId);
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [loads, total] = await this.loadRepository.findAndCount({
      where: { shipper: { id: shipper.id } },
      relations: ['acceptedBid', 'acceptedBid.carrier'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items = loads.map(load => new LoadResponseDto(load));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAvailableLoads(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [loads, total] = await this.loadRepository.findAndCount({
      where: { status: LoadStatus.PUBLISHED },
      relations: ['shipper'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items = loads.map(load => new LoadResponseDto(load));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findLoadById(loadId: string, userId: number, userRole: string): Promise<LoadResponseDto> {
    let load: Load | null = null;

    if (userRole === 'shipper') {
      const shipper = await this.getShipperByUserId(userId);
      load = await this.loadRepository.findOne({
        where: { id: loadId, shipper: { id: shipper.id } },
        relations: ['shipper', 'acceptedBid', 'acceptedBid.carrier', 'bids'],
      });
    } else {
      // Carrier can only view published/available loads
      load = await this.loadRepository.findOne({
        where: { id: loadId, status: LoadStatus.PUBLISHED },
        relations: ['shipper'],
      });
    }

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    return new LoadResponseDto(load);
  }

  // =============================================
  // UPDATE OPERATIONS
  // =============================================

  async updateLoad(
    loadId: string,
    updateLoadDto: UpdateLoadDto,
    userId: number,
  ): Promise<LoadResponseDto> {
    const load = await this.findShipperLoadEntity(loadId, userId);

    this.validateLoadCanBeUpdated(load);

    // Update load properties
    if (updateLoadDto.origin) load.origin = updateLoadDto.origin;
    if (updateLoadDto.destination) load.destination = updateLoadDto.destination;
    if (updateLoadDto.weight !== undefined) load.weight = updateLoadDto.weight;
    if (updateLoadDto.weightUnit) load.weightUnit = updateLoadDto.weightUnit;
    if (updateLoadDto.dimensions) {
      load.dimensions = {
        ...updateLoadDto.dimensions,
        unit: updateLoadDto.dimensions.unit || DimensionUnit.METERS,
      };
    }
    if (updateLoadDto.cargoTypes) load.cargoTypes = updateLoadDto.cargoTypes;
    if (updateLoadDto.pickupDate) load.pickupDate = new Date(updateLoadDto.pickupDate);
    if (updateLoadDto.deliveryDeadline)
      load.deliveryDeadline = new Date(updateLoadDto.deliveryDeadline);
    if (updateLoadDto.budget !== undefined) load.budget = updateLoadDto.budget;
    if (updateLoadDto.description !== undefined) load.description = updateLoadDto.description;

    const savedLoad = await this.loadRepository.save(load);
    return new LoadResponseDto(savedLoad);
  }

  async publishLoad(loadId: string, userId: number): Promise<LoadResponseDto> {
    const load = await this.findShipperLoadEntity(loadId, userId);

    this.validateLoadCanBePublished(load);

    load.status = LoadStatus.PUBLISHED;
    const savedLoad = await this.loadRepository.save(load);

    return new LoadResponseDto(savedLoad);
  }

  async cancelLoad(loadId: string, userId: number): Promise<LoadResponseDto> {
    const load = await this.findShipperLoadEntity(loadId, userId);

    this.validateLoadCanBeCancelled(load);

    // Cancel all pending bids
    await this.bidRepository.update(
      { load: { id: loadId }, status: BidStatus.PENDING },
      { status: BidStatus.REJECTED },
    );

    load.status = LoadStatus.CANCELLED;
    const savedLoad = await this.loadRepository.save(load);

    return new LoadResponseDto(savedLoad);
  }

  // =============================================
  // DELETE OPERATIONS
  // =============================================

  async deleteLoad(loadId: string, userId: number): Promise<void> {
    const load = await this.findShipperLoadEntity(loadId, userId);

    this.validateLoadCanBeDeleted(load);

    await this.loadRepository.remove(load);
  }

  // =============================================
  // BID OPERATIONS
  // =============================================

  async getLoadBids(loadId: string, userId: number, paginationDto: PaginationDto) {
    const load = await this.findShipperLoadEntity(loadId, userId);
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [bids, total] = await this.bidRepository.findAndCount({
      where: { load: { id: loadId } },
      relations: ['carrier', 'truck'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items: bids,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async acceptBid(loadId: string, bidId: string, userId: number) {
    const load = await this.findShipperLoadEntity(loadId, userId);

    this.validateLoadCanAcceptBid(load);

    const bid = await this.bidRepository.findOne({
      where: { id: bidId, load: { id: loadId }, status: BidStatus.PENDING },
      relations: ['carrier', 'truck'],
    });

    if (!bid) {
      throw new NotFoundException('Bid not found or not pending');
    }

    // Accept the bid
    bid.status = BidStatus.ACCEPTED;
    await this.bidRepository.save(bid);

    // Update load
    load.status = LoadStatus.ACCEPTED;
    load.acceptedBid = bid;
    load.acceptedBidAmount = Number(bid.amount);
    const savedLoad = await this.loadRepository.save(load);

    // Reject other bids
    await this.bidRepository.update(
      {
        load: { id: loadId },
        status: BidStatus.PENDING,
        id: { $ne: bidId } as any,
      },
      { status: BidStatus.REJECTED },
    );

    return new LoadResponseDto(savedLoad);
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  private async getShipperByUserId(userId: number): Promise<Shipper> {
    const shipper = await this.shipperRepository.findOne({
      where: { user: { id: userId } } as unknown as FindOptionsWhere<Shipper>,
    });

    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }

    return shipper;
  }

  private async findShipperLoadEntity(loadId: string, userId: number): Promise<Load> {
    const shipper = await this.getShipperByUserId(userId);

    const load = await this.loadRepository.findOne({
      where: { id: loadId, shipper: { id: shipper.id } },
      relations: ['shipper', 'acceptedBid'],
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    return load;
  }

  private validateLoadCanBeUpdated(load: Load): void {
    const updatableStatuses = [LoadStatus.DRAFT];

    if (!updatableStatuses.includes(load.status)) {
      throw new BadRequestException(`Cannot update load with status: ${load.status}`);
    }
  }

  private validateLoadCanBeDeleted(load: Load): void {
    const deletableStatuses = [LoadStatus.DRAFT, LoadStatus.CANCELLED];

    if (!deletableStatuses.includes(load.status)) {
      throw new BadRequestException(`Cannot delete load with status: ${load.status}`);
    }
  }

  private validateLoadCanBePublished(load: Load): void {
    if (load.status !== LoadStatus.DRAFT) {
      throw new BadRequestException(`Cannot publish load with status: ${load.status}`);
    }

    if (!load.origin?.address || !load.destination?.address) {
      throw new BadRequestException('Load must have valid origin and destination to be published');
    }

    if (!load.pickupDate || !load.deliveryDeadline) {
      throw new BadRequestException(
        'Load must have pickup date and delivery deadline to be published',
      );
    }

    if (load.budget <= 0) {
      throw new BadRequestException('Load must have a positive budget to be published');
    }
  }

  private validateLoadCanBeCancelled(load: Load): void {
    const cancellableStatuses = [LoadStatus.DRAFT, LoadStatus.PUBLISHED];

    if (!cancellableStatuses.includes(load.status)) {
      throw new BadRequestException(`Cannot cancel load with status: ${load.status}`);
    }
  }

  private validateLoadCanAcceptBid(load: Load): void {
    if (load.status !== LoadStatus.PUBLISHED) {
      throw new BadRequestException(`Cannot accept bid for load with status: ${load.status}`);
    }
  }

  // =============================================
  // LEGACY METHODS (for backward compatibility)
  // =============================================

  async getShipperIdByUserId(userId: number): Promise<number> {
    const shipper = await this.getShipperByUserId(userId);
    return shipper.id;
  }

  async createByUserId(createLoadDto: CreateLoadDto, userId: number): Promise<LoadResponseDto> {
    return this.createLoad(createLoadDto, userId);
  }

  async findAllByUserIdPaginated(userId: number, page = 1, limit = 10) {
    const paginationDto = { page, limit };
    return this.findShipperLoads(userId, paginationDto);
  }

  async findAllPublicPaginated(page = 1, limit = 10) {
    const paginationDto = { page, limit };
    return this.findAvailableLoads(paginationDto);
  }

  async findOne(id: string): Promise<LoadResponseDto> {
    const load = await this.loadRepository.findOne({
      where: { id } as unknown as FindOptionsWhere<Load>,
      relations: ['shipper', 'shipper.user', 'acceptedBid', 'acceptedBid.carrier'],
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    return new LoadResponseDto(load);
  }

  async updateByUserId(id: string, updateLoadDto: UpdateLoadDto): Promise<LoadResponseDto> {
    const load = await this.loadRepository.findOne({
      where: { id } as unknown as FindOptionsWhere<Load>,
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    Object.assign(load, updateLoadDto);
    const savedLoad = await this.loadRepository.save(load);
    return new LoadResponseDto(savedLoad);
  }

  async removeByUserId(id: string): Promise<void> {
    const load = await this.loadRepository.findOne({
      where: { id } as unknown as FindOptionsWhere<Load>,
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    await this.loadRepository.remove(load);
  }
}
