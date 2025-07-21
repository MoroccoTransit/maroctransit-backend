import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { LoadsService } from './loads.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { LoadResponseDto } from './dto/load-response.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.gaurd';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('loads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  @Post()
  @Roles('shipper')
  @HttpCode(HttpStatus.CREATED)
  async createLoad(
    @Body() createLoadDto: CreateLoadDto,
    @Req() req: RequestWithUser,
  ): Promise<LoadResponseDto> {
    return this.loadsService.createLoad(createLoadDto, req.user.id);
  }

  @Get()
  @Roles('shipper')
  async getShipperLoads(@Req() req: RequestWithUser, @Query() paginationDto: PaginationDto) {
    return this.loadsService.findShipperLoads(req.user.id, paginationDto);
  }

  @Get('public')
  @Roles('carrier')
  async getAvailableLoads(@Query() paginationDto: PaginationDto) {
    return this.loadsService.findAvailableLoads(paginationDto);
  }

  @Get(':id')
  @Roles('shipper', 'carrier')
  async getLoadById(
    @Param('id') loadId: string,
    @Req() req: RequestWithUser,
  ): Promise<LoadResponseDto> {
    return this.loadsService.findLoadById(loadId, req.user.id, req.user.role.name);
  }

  @Patch(':id')
  @Roles('shipper')
  async updateLoad(
    @Param('id') loadId: string,
    @Body() updateLoadDto: UpdateLoadDto,
    @Req() req: RequestWithUser,
  ): Promise<LoadResponseDto> {
    return this.loadsService.updateLoad(loadId, updateLoadDto, req.user.id);
  }

  @Delete(':id')
  @Roles('shipper')
  @HttpCode(HttpStatus.OK)
  async deleteLoad(
    @Param('id') loadId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.loadsService.deleteLoad(loadId, req.user.id);
    return { message: 'Load deleted successfully' };
  }

  @Post(':id/publish')
  @Roles('shipper')
  async publishLoad(
    @Param('id') loadId: string,
    @Req() req: RequestWithUser,
  ): Promise<LoadResponseDto> {
    return this.loadsService.publishLoad(loadId, req.user.id);
  }

  @Post(':id/cancel')
  @Roles('shipper')
  async cancelLoad(
    @Param('id') loadId: string,
    @Req() req: RequestWithUser,
  ): Promise<LoadResponseDto> {
    return this.loadsService.cancelLoad(loadId, req.user.id);
  }

  @Get(':id/bids')
  @Roles('shipper')
  async getLoadBids(
    @Param('id') loadId: string,
    @Req() req: RequestWithUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.loadsService.getLoadBids(loadId, req.user.id, paginationDto);
  }

  @Post(':id/accept-bid/:bidId')
  @Roles('shipper')
  async acceptBid(
    @Param('id') loadId: string,
    @Param('bidId') bidId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.loadsService.acceptBid(loadId, bidId, req.user.id);
  }
}
