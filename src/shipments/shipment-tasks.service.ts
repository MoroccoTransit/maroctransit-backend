import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, IsNull, Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentStatus } from './enums/shipment-status.enum';

@Injectable()
export class ShipmentTasksService {
  private readonly logger = new Logger(ShipmentTasksService.name);

  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateDelayedShipments() {
    const currentDate = new Date();
    this.logger.log(`Checking for delayed shipments at ${currentDate.toISOString()}`);

    try {
      const result = await this.shipmentRepository.update(
        {
          estimatedDeliveryDate: LessThan(currentDate),
          status: Not(ShipmentStatus.DELIVERED),
          actualDeliveryDate: IsNull(),
        },
        { status: ShipmentStatus.DELAYED },
      );

      this.logger.log(`Marked ${result.affected} shipments as delayed`);
    } catch (error) {
      this.logger.error(`Delay update failed: ${error.message}`, error.stack);
    }
  }
}
