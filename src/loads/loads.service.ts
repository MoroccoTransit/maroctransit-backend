import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Load } from './entities/load.entity';
import { Shipper } from '../users/entities/shipper.entity';
import { CreateLoadDto } from './dto/create-load.dto';
import { LoadStatus } from './enums/load-status.enum';
import { UpdateLoadDto } from './dto/update-load.dto';

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Shipper)
    private readonly shipperRepository: Repository<Shipper>,
  ) {}

  async getShipperIdByUserId(userId: number): Promise<number> {
    const shipper = await this.shipperRepository.findOne({
      where: { user: { id: userId } } as unknown as FindOptionsWhere<Shipper>,
    });
    if (!shipper) throw new NotFoundException('Shipper not found');
    return shipper.id;
  }

  async createByUserId(createLoadDto: CreateLoadDto, userId: number): Promise<Load> {
    const shipperId = await this.getShipperIdByUserId(userId);
    const shipper = await this.shipperRepository.findOne({ where: { id: shipperId } });
    if (!shipper) throw new NotFoundException('Shipper not found');
    const load = this.loadRepository.create({
      ...createLoadDto,
      status: LoadStatus.PENDING,
      shipper,
    });
    return await this.loadRepository.save(load);
  }

  async findAllByUserIdPaginated(
    userId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: Load[]; total: number; page: number; limit: number }> {
    const shipperId = await this.getShipperIdByUserId(userId);
    const [data, total] = await this.loadRepository.findAndCount({
      where: { shipper: { id: shipperId } } as unknown as FindOptionsWhere<Load>,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findAllPublicPaginated(
    page = 1,
    limit = 10,
  ): Promise<{ data: Load[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.loadRepository.findAndCount({
      where: { status: LoadStatus.PENDING },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOneByUserId(id: string, userId: number): Promise<any> {
    const shipperId = await this.getShipperIdByUserId(userId);
    const load = await this.loadRepository.findOne({
      where: { id, shipper: { id: shipperId } } as unknown as FindOptionsWhere<Load>,
      relations: { shipper: { user: true } },
    });
    if (!load) throw new NotFoundException('Load not found');
    const result = {
      ...load,
      shipper: {
        ...load.shipper,
        user: {
          id: load.shipper.user.id,
          email: load.shipper.user.email,
        },
      },
    };
    return result;
  }

  async updateByUserId(id: string, userId: number, updateLoadDto: UpdateLoadDto): Promise<Load> {
    const load = await this.findOneByUserId(id, userId);
    Object.assign(load, updateLoadDto);
    return this.loadRepository.save(load);
  }

  async removeByUserId(id: string, userId: number): Promise<void> {
    const load = await this.findOneByUserId(id, userId);
    await this.loadRepository.remove(load);
  }
}
