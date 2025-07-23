import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackingService } from './tracking.service';
import { TrucksService } from '../trucks/trucks.service';
import { WsJwtGuard } from '../auth/guards/ws-auth.guard';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.gaurd';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: '*', // Add your frontend URLs
    credentials: true,
  },
})
@Injectable()
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private connectedClients = new Map<
    string,
    { userId: number; role: string; shipmentIds: string[] }
  >();

  constructor(
    private readonly trackingService: TrackingService,
    private readonly trucksService: TrucksService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`🔌 WebSocket connection attempt: ${client.id}`);
    this.logger.log(`📋 Client handshake auth:`, client.handshake?.auth);

    try {
      // Extract token exactly like WsJwtGuard does
      const token =
        client.handshake?.auth?.token || client.handshake?.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.error(`❌ No token provided for ${client.id}`);
        client.emit('error', { message: 'Authentication failed - no token provided' });
        client.disconnect();
        return;
      }

      // Verify token exactly like WsJwtGuard does
      const payload = this.jwtService.verify(token as string);
      client.data = client.data || {};
      client.data.user = payload;

      this.logger.log(`👤 User authenticated:`, payload);

      this.connectedClients.set(client.id, {
        userId: payload.sub,
        role: payload.role,
        shipmentIds: [],
      });

      this.logger.log(
        `✅ Client authenticated and connected: ${client.id}, User: ${payload.sub}, Role: ${payload.role}`,
      );

      // Send the connected message
      client.emit('connected', {
        message: 'Connected to tracking service',
        userId: payload.sub,
        role: payload.role,
      });

      this.logger.log(`📤 Sent 'connected' message to client: ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ Authentication error for ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed', error: error.message });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToShipment')
  @UseGuards(WsJwtGuard, RolesGuard)
  async handleSubscribeToShipment(
    @MessageBody() data: { shipmentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (!clientInfo) {
        return { event: 'error', data: 'Client not properly authenticated' };
      }

      // Verify user has access to this shipment
      try {
        await this.trackingService.getTrackingInfo(
          data.shipmentId,
          clientInfo.role,
          clientInfo.userId,
        );
      } catch (error) {
        return { event: 'error', data: 'Access denied to this shipment' };
      }

      // Join the shipment room
      await client.join(`shipment:${data.shipmentId}`);

      // Update client's subscribed shipments
      if (!clientInfo.shipmentIds.includes(data.shipmentId)) {
        clientInfo.shipmentIds.push(data.shipmentId);
      }

      // Debug: Check how many clients are now in the room
      const roomName = `shipment:${data.shipmentId}`;
      const clientsInRoom = await this.server.in(roomName).fetchSockets();
      this.logger.debug(
        `Client ${client.id} subscribed to shipment ${data.shipmentId}. Total clients in room: ${clientsInRoom.length}`,
      );

      return { event: 'subscribed', data: { shipmentId: data.shipmentId } };
    } catch (error) {
      this.logger.error('Subscription error:', error);
      return { event: 'error', data: 'Failed to subscribe to shipment' };
    }
  }

  @SubscribeMessage('unsubscribeFromShipment')
  @UseGuards(WsJwtGuard, RolesGuard)
  async handleUnsubscribeFromShipment(
    @MessageBody() data: { shipmentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (!clientInfo) {
        return { event: 'error', data: 'Client not properly authenticated' };
      }

      // Leave the shipment room
      await client.leave(`shipment:${data.shipmentId}`);

      // Update client's subscribed shipments
      clientInfo.shipmentIds = clientInfo.shipmentIds.filter(id => id !== data.shipmentId);

      this.logger.debug(`Client ${client.id} unsubscribed from shipment ${data.shipmentId}`);

      return { event: 'unsubscribed', data: { shipmentId: data.shipmentId } };
    } catch (error) {
      this.logger.error('Unsubscription error:', error);
      return { event: 'error', data: 'Failed to unsubscribe from shipment' };
    }
  }

  @SubscribeMessage('updateLocation')
  @UseGuards(WsJwtGuard, RolesGuard)
  @Roles('driver')
  async handleUpdateLocation(
    @MessageBody() updateLocationDto: UpdateLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      const driver = await this.trucksService.findDriverByUserId(Number(user.sub));

      if (!driver) {
        client.emit('error', {
          message: 'No driver entity found for this user.',
          code: 'DRIVER_NOT_FOUND',
        });
        return { event: 'error', data: 'No driver entity found for this user.' };
      }

      // Update location through tracking service - FIXED: Pass user.sub instead of driver.id
      const locationHistory = await this.trackingService.updateLocation(
        updateLocationDto,
        String(user.sub), // This is the fix - pass user ID, not driver ID
      );

      // Prepare location update data
      const locationUpdateData = {
        shipmentId: updateLocationDto.shipmentId,
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
      };

      // Emit location update to all subscribers of this shipment
      const roomName = `shipment:${updateLocationDto.shipmentId}`;

      // Debug: Check which clients are in the room
      const clientsInRoom = await this.server.in(roomName).fetchSockets();
      this.logger.debug(
        `Broadcasting to room ${roomName}, clients in room: ${clientsInRoom.length}`,
      );

      this.server.to(roomName).emit('locationUpdated', locationUpdateData);

      // Also update the old truck location namespace for backward compatibility
      this.server.emit('truckLocationUpdated', {
        truckId: updateLocationDto.truckId,
        lat: updateLocationDto.lat,
        lng: updateLocationDto.lng,
        timestamp: locationHistory.createdAt,
      });

      // Send success confirmation to the driver
      client.emit('locationUpdateSuccess', {
        message: 'Location updated and broadcasted successfully',
        shipmentId: updateLocationDto.shipmentId,
        timestamp: locationHistory.createdAt,
      });

      this.logger.debug(
        `Location updated for shipment ${updateLocationDto.shipmentId}, broadcasted to room: ${roomName}`,
      );

      return { event: 'success', data: 'Location updated successfully.' };
    } catch (error) {
      this.logger.error('Location update error:', error);

      // Send detailed error to client
      client.emit('error', {
        message: error?.message || 'Failed to update location',
        code: 'LOCATION_UPDATE_ERROR',
        details: error?.message,
      });

      return { event: 'error', data: error?.message || 'Internal server error' };
    }
  }

  @SubscribeMessage('getShipmentStatus')
  @UseGuards(WsJwtGuard, RolesGuard)
  async handleGetShipmentStatus(
    @MessageBody() data: { shipmentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (!clientInfo) {
        return { event: 'error', data: 'Client not properly authenticated' };
      }

      const trackingInfo = await this.trackingService.getTrackingInfo(
        data.shipmentId,
        clientInfo.role,
        clientInfo.userId,
      );

      return { event: 'shipmentStatus', data: trackingInfo };
    } catch (error) {
      this.logger.error('Get shipment status error:', error);
      return { event: 'error', data: error?.message || 'Failed to get shipment status' };
    }
  }

  // Method to emit notifications from other parts of the application
  emitShipmentNotification(shipmentId: string, notification: any) {
    this.server.to(`shipment:${shipmentId}`).emit('notification', notification);
  }

  // Method to emit status changes
  emitShipmentStatusChange(shipmentId: string, newStatus: string, additionalData?: any) {
    console.log(`Emitting status change for shipment ${shipmentId} to ${newStatus}`);
    this.server.to(`shipment:${shipmentId}`).emit('statusChanged', {
      shipmentId,
      newStatus,
      timestamp: new Date(),
      ...additionalData,
    });
  }
}
