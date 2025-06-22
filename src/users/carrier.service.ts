import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier } from './entities/carrier.entity';

@Injectable()
export class CarrierService {
  constructor(
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
  ) {}

  async findById(id: number): Promise<Carrier | null> {
    return this.carrierRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: number): Promise<Carrier | null> {
    return this.carrierRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }
}
