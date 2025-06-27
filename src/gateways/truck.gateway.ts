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
import { TrucksService } from '../trucks/trucks.service';
import { WsJwtGuard } from 'src/auth/guards/ws-auth.guard';
import { UseGuards, Injectable } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';

@WebSocketGateway({ namespace: '/truck-location-updates', cors: true })
@Injectable()
@UseGuards(WsJwtGuard, RolesGuard)
export class TruckGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly trucksService: TrucksService) {}

  async handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('updateLocation')
  @Roles('driver')
  async handleUpdateLocation(
    @MessageBody() data: { truckId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log('Received updateLocation event:', data);
      const user = client.data.user;
      const driver = await this.trucksService.findDriverByUserId(Number(user.sub));
      if (!driver) {
        return { event: 'error', data: 'No driver entity found for this user.' };
      }
      const isAssigned = await this.trucksService.isDriverAssignedToTruck(
        String(driver.id),
        data.truckId,
      );
      if (!isAssigned) {
        return { event: 'error', data: 'Driver is not assigned to this truck.' };
      }
      await this.trucksService.updateTruckLocation(data.truckId, data.lat, data.lng);
      this.server.emit('truckLocationUpdated', {
        truckId: data.truckId,
        lat: data.lat,
        lng: data.lng,
      });
      return { event: 'success', data: 'Location updated.' };
    } catch (err) {
      return { event: 'error', data: err?.message || 'Internal server error' };
    }
  }
}
