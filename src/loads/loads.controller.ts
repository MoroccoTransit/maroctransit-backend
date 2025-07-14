import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  Get,
  Query,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { LoadsService } from './loads.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { Load } from './entities/load.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.gaurd';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateLoadDto } from './dto/update-load.dto';

@Controller('loads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoadsController {
  private readonly logger = new Logger(LoadsController.name);
  constructor(private readonly loadsService: LoadsService) {}

  @Post()
  @Roles('shipper')
  async create(@Body() createLoadDto: CreateLoadDto, @Request() req): Promise<Load> {
    this.logger.debug('req.user in create load:', req.user);
    // Find the shipper by user id
    return await this.loadsService.createByUserId(createLoadDto, req.user.id);
  }

  // Get all loads for the shipper with pagination
  @Get()
  @Roles('shipper')
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: Load[]; total: number; page: number; limit: number }> {
    return this.loadsService.findAllByUserIdPaginated(req.user.id, page, limit);
  }

  // Get all available loads for carriers (public loads)
  @Get('public')
  @Roles('carrier')
  async getPublicLoads(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: Load[]; total: number; page: number; limit: number }> {
    return this.loadsService.findAllPublicPaginated(page, limit);
  }

  // Get details of a specific load
  @Get(':id')
  @Roles('shipper')
  async findOne(@Param('id') id: string, @Request() req): Promise<any> {
    return this.loadsService.findOneByUserId(id, req.user.id);
  }

  // Update a load
  @Put(':id')
  @Roles('shipper')
  async update(
    @Param('id') id: string,
    @Body() updateLoadDto: UpdateLoadDto,
    @Request() req,
  ): Promise<Load> {
    return this.loadsService.updateByUserId(id, req.user.id, updateLoadDto);
  }

  // Delete a load
  @Delete(':id')
  @Roles('shipper')
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    await this.loadsService.removeByUserId(id, req.user.id);
    return { message: 'Load deleted successfully' };
  }
}
