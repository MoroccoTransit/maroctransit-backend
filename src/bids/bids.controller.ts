import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Request,
  Patch,
  Query,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.gaurd';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  // Carrier creates a bid on a load
  @Post()
  @Roles('carrier')
  async createBid(
    @Query('loadId') loadId: string,
    @Body() createBidDto: CreateBidDto,
    @Request() req,
  ) {
    return this.bidsService.createBid(loadId, req.user.id, createBidDto);
  }

  // Shipper accepts a bid
  @Post('accept')
  @Roles('shipper')
  async acceptBid(@Query('bidId') bidId: string, @Request() req) {
    return this.bidsService.acceptBidByBidId(bidId, req.user.id);
  }

  // GET /bids?loadId=... (shipper: bids for a load, paginated)
  @Get()
  @Roles('shipper')
  async getBids(
    @Request() req,
    @Query('loadId') loadId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Find shipper by userId
    return this.bidsService.getBidsForLoadPaginated(loadId, req.user.id, page, limit);
  }
}
