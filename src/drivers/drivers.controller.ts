import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CarrierGuard } from 'src/auth/guards/carrier.guard';
import { RequestWithCarrier } from 'src/auth/interfaces/request-with-carrier.interface';
import { DriverResponseDto } from './dto/driver-response.dto';

@Controller('drivers')
@UseGuards(JwtAuthGuard, CarrierGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  create(
    @Req() req: RequestWithCarrier,
    @Body() createDriverDto: CreateDriverDto,
  ): Promise<DriverResponseDto> {
    return this.driversService.create(req.carrier.id, createDriverDto);
  }

  @Get()
  findAll(@Req() req: RequestWithCarrier): Promise<DriverResponseDto[]> {
    return this.driversService.findAll(req.carrier.id);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithCarrier, @Param('id') id: string): Promise<DriverResponseDto> {
    return this.driversService.findOneAndFormat(req.carrier.id, id);
  }

  @Put(':id')
  update(
    @Req() req: RequestWithCarrier,
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ): Promise<DriverResponseDto> {
    return this.driversService.update(req.carrier.id, id, updateDriverDto);
  }

  @Delete(':id')
  async remove(
    @Req() req: RequestWithCarrier,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.driversService.remove(req.carrier.id, id);
    return { message: 'Driver deleted successfully' };
  }
}
