import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.gaurd';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';
import { TrackingInfoDto } from './dto/tracking-info.dto';

interface AuthRequest extends Request {
  user: {
    id: number;
    role: string;
    driverId?: string;
  };
}

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(
    private readonly trackingService: TrackingService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  @Get(':shipmentId')
  @Roles('shipper', 'carrier', 'driver')
  async getTrackingInfo(
    @Param('shipmentId') shipmentId: string,
    @Request() req: AuthRequest,
  ): Promise<TrackingInfoDto> {
    this.logger.debug(`Getting tracking info for shipment ${shipmentId} by user ${req.user.id}`);

    return await this.trackingService.getTrackingInfo(shipmentId, req.user.role, req.user.id);
  }

  @Get(':shipmentId/history')
  @Roles('shipper', 'carrier', 'driver')
  async getLocationHistory(
    @Param('shipmentId') shipmentId: string,
    @Query('limit') limit = 50,
    @Request() req: AuthRequest,
  ) {
    this.logger.debug(`Getting location history for shipment ${shipmentId} by user ${req.user.id}`);

    return await this.trackingService.getLocationHistory(
      shipmentId,
      req.user.role,
      req.user.id,
      Math.min(Number(limit), 100), // Cap at 100 records
    );
  }

  @Post(':shipmentId/location')
  @Roles('driver')
  async updateLocation(
    @Param('shipmentId') shipmentId: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @Request() req: AuthRequest,
  ) {
    this.logger.debug(`Updating location for shipment ${shipmentId} by driver ${req.user.id}`);

    // Ensure shipmentId matches the one in the body
    updateLocationDto.shipmentId = shipmentId;

    const locationHistory = await this.trackingService.updateLocation(
      updateLocationDto,
      String(req.user.id),
    );

    // Emit real-time update
    this.trackingGateway.server.to(`shipment:${shipmentId}`).emit('locationUpdated', {
      shipmentId,
      truckId: updateLocationDto.truckId,
      location: {
        lat: updateLocationDto.lat,
        lng: updateLocationDto.lng,
        accuracy: updateLocationDto.accuracy,
        heading: updateLocationDto.heading,
        speed: updateLocationDto.speed,
      },
      timestamp: locationHistory.createdAt,
      notes: updateLocationDto.notes,
    });

    return {
      success: true,
      message: 'Location updated successfully',
      data: locationHistory,
    };
  }

  @Get('shipper/shipments')
  @Roles('shipper')
  async getShipperActiveShipments(@Request() req: AuthRequest) {
    this.logger.debug(`Getting active shipments for shipper ${req.user.id}`);

    // This would need to be implemented in the shipments service
    // For now, return a placeholder
    return {
      message: 'This endpoint will return active shipments for the shipper',
      shipments: [],
    };
  }
}
