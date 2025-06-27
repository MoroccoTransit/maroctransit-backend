import { Controller, Patch, Param, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
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
}
