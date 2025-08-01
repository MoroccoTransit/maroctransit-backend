import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Socket } from 'socket.io';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('Required Roles:', requiredRoles);
    if (!requiredRoles) return true;

    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient<Socket>();
      const user = client.data.user;
      console.log('User in RolesGuard:', user, 'Required Roles:', requiredRoles);
      return requiredRoles.some(role => user?.role === role);
    } else if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      console.log('User in RolesGuard:', user, 'Required Roles:', requiredRoles);
      return requiredRoles.some(role => user?.role?.name === role);
    }
    return false;
  }
}
