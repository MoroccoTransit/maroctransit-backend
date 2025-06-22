import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CarrierService } from 'src/users/carrier.service';

@Injectable()
export class CarrierGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private carrierService: CarrierService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) return false;

    try {
      const payload = this.jwtService.verify(token);
      if (payload.role !== 'carrier') return false;

      const carrier = await this.carrierService.findById(payload.profileId);
      if (!carrier) return false;

      request.carrier = carrier;
      return true;
    } catch {
      return false;
    }
  }
}
