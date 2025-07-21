import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.gaurd';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Patch(':id/assign-driver')
  @Roles('carrier')
  async assignDriver(
    @Param('id') shipmentId: string,
    @Body('driverId') driverId: string,
    @Request() req,
  ) {
    return this.shipmentsService.assignDriver(shipmentId, driverId, Number(req.user.id));
  }

  @Get()
  @Roles('shipper')
  async getShipments(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.shipmentsService.findAllPaginated(Number(req.user.id), page, limit);
  }

  @Get('carrier')
  @Roles('carrier')
  async getShipmentsForCarrierAcceptedBids(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.shipmentsService.findShipmentsForCarrierAcceptedBids(
      Number(req.user.id),
      page,
      limit,
    );
  }

  @Patch(':id/start')
  @Roles('driver')
  async startShipment(@Param('id') shipmentId: string, @Request() req) {
    return this.shipmentsService.startShipment(shipmentId, Number(req.user.id));
  }

  @Patch(':id/deliver')
  @Roles('driver')
  async markAsDelivered(@Param('id') shipmentId: string, @Request() req) {
    return this.shipmentsService.markAsDelivered(shipmentId, Number(req.user.id));
  }
}
