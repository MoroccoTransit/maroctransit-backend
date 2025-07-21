import { Controller, Post, Body, Param, Get, UseGuards, Req, Patch, Query } from '@nestjs/common';
import { Request } from 'express';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { BidFilterDto } from './dto/bid-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.gaurd';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @Roles('carrier')
  async createBid(
    @Query('loadId') loadId: string,
    @Body() createBidDto: CreateBidDto,
    @Req() req: RequestWithUser,
  ) {
    return this.bidsService.createBid(loadId, req.user.id, createBidDto);
  }

  @Post('accept')
  @Roles('shipper')
  async acceptBid(@Query('bidId') bidId: string, @Req() req: RequestWithUser) {
    return this.bidsService.acceptBidByBidId(bidId, req.user.id);
  }

  @Get()
  @Roles('shipper')
  async getBids(
    @Req() req: RequestWithUser,
    @Query('loadId') loadId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.bidsService.getBidsForLoadPaginated(loadId, req.user.id, page, limit);
  }

  @Get('carrier')
  @Roles('carrier')
  async getCarrierBids(
    @Req() req: RequestWithUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() filters: BidFilterDto,
  ) {
    return this.bidsService.getCarrierBidsByUserId(req.user.id, page, limit, filters);
  }

  @Patch(':id')
  @Roles('carrier')
  async updateBid(
    @Param('id') id: string,
    @Body() updateBidDto: UpdateBidDto,
    @Req() req: RequestWithUser,
  ) {
    return this.bidsService.updateBid(id, req.user.id, updateBidDto);
  }

  @Patch(':id/cancel')
  @Roles('carrier')
  async cancelBid(@Param('id') id: string, @Req() req: RequestWithUser) {
    const cancelledBid = await this.bidsService.cancelBid(id, req.user.id);
    return {
      message: 'Bid cancelled successfully',
      bid: cancelledBid,
    };
  }
}
