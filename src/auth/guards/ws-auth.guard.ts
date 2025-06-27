import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Reflector } from '@nestjs/core';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token =
      client.handshake?.auth?.token || client.handshake?.headers?.authorization?.split(' ')[1];

    if (!token) throw new WsException('Token not provided');

    try {
      const payload = this.jwtService.verify(token);
      client.data = client.data || {};
      client.data.user = payload;
      return true;
    } catch (err) {
      throw new WsException('Invalid or expired token');
    }
  }
}
