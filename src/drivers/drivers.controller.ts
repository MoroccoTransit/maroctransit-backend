import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { DriverResponseDto } from './dto/driver-response.dto';
import { CarrierService } from 'src/users/carrier.service';
import { User } from 'src/users/entities/user.entity';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('carrier')
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly carrierService: CarrierService,
  ) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() createDriverDto: CreateDriverDto,
  ): Promise<DriverResponseDto> {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) throw new BadRequestException('Carrier not found');
    return this.driversService.create(carrier.id, createDriverDto);
  }

  @Get()
  async findAll(@Req() req: RequestWithUser): Promise<DriverResponseDto[]> {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) throw new BadRequestException('Carrier not found');
    return this.driversService.findAll(carrier.id);
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string): Promise<DriverResponseDto> {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) throw new BadRequestException('Carrier not found');
    return this.driversService.findOneAndFormat(carrier.id, id);
  }

  @Put(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ): Promise<DriverResponseDto> {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) throw new BadRequestException('Carrier not found');
    return this.driversService.update(carrier.id, id, updateDriverDto);
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id') id: string): Promise<{ message: string }> {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) throw new BadRequestException('Carrier not found');
    await this.driversService.remove(carrier.id, id);
    return { message: 'Driver deleted successfully' };
  }
}
