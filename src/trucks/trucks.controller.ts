import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Req,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { CarrierService } from 'src/users/carrier.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { Express, Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/shared/file-upload/config/multer.config';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { FileUploadService } from 'src/shared/file-upload/file-upload.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('trucks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('carrier')
export class TrucksController {
  private readonly logger = new Logger(TrucksController.name);

  constructor(
    private readonly trucksService: TrucksService,
    private readonly carrierService: CarrierService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'primaryImage', maxCount: 1 },
        { name: 'additionalImages', maxCount: 10 },
      ],
      multerConfig,
    ),
  )
  async craeteTruck(
    @UploadedFiles()
    files: {
      primaryImage?: Express.Multer.File[];
      additionalImages?: Express.Multer.File[];
    },
    @Body() createTruckDto: CreateTruckDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.debug(`Received files: ${JSON.stringify(files)}`);
    this.logger.debug(`Received DTO: ${JSON.stringify(createTruckDto)}`);

    if (!files || !files.primaryImage || files.primaryImage.length === 0) {
      throw new BadRequestException('Primary image is required');
    }

    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) {
      throw new BadRequestException('Carrier not found');
    }

    const primaryImageUrl = this.fileUploadService.getFileUrl(files.primaryImage[0].filename);

    const additionalImageUrls =
      files.additionalImages?.map(file => this.fileUploadService.getFileUrl(file.filename)) || [];

    return this.trucksService.createTruck(
      createTruckDto,
      carrier,
      primaryImageUrl,
      additionalImageUrls,
    );
  }

  @Get()
  async getTrucks(@Query() paginationDto: PaginationDto, @Req() req: RequestWithUser) {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) {
      throw new BadRequestException('Carrier not found');
    }

    return this.trucksService.findTrucksByCarrier(carrier.id, paginationDto);
  }

  @Get(':id')
  async getTruck(@Param('id') id: string, @Req() req: RequestWithUser) {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) {
      throw new BadRequestException('Carrier not found');
    }

    return this.trucksService.findOne(id, carrier.id);
  }

  @Delete(':id')
  async deleteTruck(@Param('id') id: string, @Req() req: RequestWithUser) {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) {
      throw new BadRequestException('Carrier not found');
    }

    await this.trucksService.delete(id, carrier.id);
    return { message: 'Truck deleted successfully' };
  }

  @Put(':id')
  async updateTruck(
    @Param('id') id: string,
    @Body() updateTruckDto: UpdateTruckDto,
    @Req() req: RequestWithUser,
  ) {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) {
      throw new BadRequestException('Carrier not found');
    }

    return this.trucksService.update(id, carrier.id, updateTruckDto);
  }

  @Post(':id/assign-driver/:driverId')
  async assignDriver(
    @Param('id') id: string,
    @Param('driverId') driverId: string,
    @Req() req: RequestWithUser,
  ) {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) {
      throw new BadRequestException('Carrier not found');
    }

    return this.trucksService.assignDriver(id, driverId, carrier.id);
  }

  @Post(':id/unassign-driver')
  async unassignDriver(@Param('id') id: string, @Req() req: RequestWithUser) {
    const carrier = await this.carrierService.findByUserId(req.user.id);
    if (!carrier) {
      throw new BadRequestException('Carrier not found');
    }

    return this.trucksService.unassignDriver(id, carrier.id);
  }
}
