import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationHistory } from './entities/location-history.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Truck } from '../trucks/entities/truck.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { TrackingInfoDto } from './dto/tracking-info.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(LocationHistory)
    private readonly locationHistoryRepository: Repository<LocationHistory>,
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
  ) {}

  async updateLocation(
    updateLocationDto: UpdateLocationDto,
    userId: string,
  ): Promise<LocationHistory> {
    const { shipmentId, truckId, lat, lng, accuracy, heading, speed, notes, recordedAt } =
      updateLocationDto;

    // Verify shipment exists and driver is assigned
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['driver', 'driver.user', 'truck', 'load'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (!shipment.driver || !shipment.driver.user || String(shipment.driver.user.id) !== userId) {
      throw new ForbiddenException('You are not assigned to this shipment');
    }

    if (shipment.truck.id !== truckId) {
      throw new ForbiddenException('Truck does not match shipment assignment');
    }

    // Update truck location using find and save approach for JSON fields
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (truck) {
      console.log(`🚛 BEFORE: Truck ${truckId} location:`, truck.currentLocation);
      truck.currentLocation = { lat, lng };
      const savedTruck = await this.truckRepository.save(truck);
      console.log(`🚛 AFTER: Truck ${truckId} location:`, savedTruck.currentLocation);
    } else {
      console.log(`❌ Truck ${truckId} not found`);
    }

    // Update shipment current location using find and save approach for JSON fields
    const shipmentToUpdate = await this.shipmentRepository.findOne({ where: { id: shipmentId } });
    if (shipmentToUpdate) {
      console.log(`📦 BEFORE: Shipment ${shipmentId} location:`, shipmentToUpdate.currentLocation);
      shipmentToUpdate.currentLocation = { lat, lng };
      const savedShipment = await this.shipmentRepository.save(shipmentToUpdate);
      console.log(`📦 AFTER: Shipment ${shipmentId} location:`, savedShipment.currentLocation);
    } else {
      console.log(`❌ Shipment ${shipmentId} not found`);
    }

    // Create location history entry
    const locationHistory = this.locationHistoryRepository.create({
      location: {
        lat,
        lng,
        accuracy,
        heading,
        speed,
      },
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      notes,
      shipment,
      truck: shipment.truck,
    });

    return await this.locationHistoryRepository.save(locationHistory);
  }
  async getTrackingInfo(
    shipmentId: string,
    userRole: string,
    userId: number,
  ): Promise<TrackingInfoDto> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: [
        'load',
        'load.shipper',
        'load.shipper.user',
        'truck',
        'driver',
        'driver.user',
        'carrier',
        'carrier.user',
      ],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Authorization check
    if (userRole === 'shipper' && shipment.load.shipper.user.id !== userId) {
      throw new ForbiddenException('You can only track your own shipments');
    }

    if (userRole === 'carrier' && shipment.carrier.user.id !== userId) {
      throw new ForbiddenException('You can only track your company shipments');
    }

    if (userRole === 'driver' && (!shipment.driver || shipment.driver.user.id !== userId)) {
      throw new ForbiddenException('You can only track shipments assigned to you');
    }

    // Get recent location history
    const recentEvents = await this.locationHistoryRepository.find({
      where: { shipment: { id: shipmentId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Calculate estimated arrival (simplified - you can enhance this with route optimization)
    const estimatedArrival = this.calculateEstimatedArrival(shipment, recentEvents);

    return {
      shipmentId: shipment.id,
      truckId: shipment.truck.id,
      currentLocation: shipment.currentLocation || shipment.truck.currentLocation,
      lastUpdate: recentEvents[0]?.createdAt || shipment.updatedAt,
      status: shipment.status,
      estimatedArrival,
      route: {
        origin: {
          lat: shipment.load.origin.coordinates.lat,
          lng: shipment.load.origin.coordinates.lng,
          address: shipment.load.origin.address,
        },
        destination: {
          lat: shipment.load.destination.coordinates.lat,
          lng: shipment.load.destination.coordinates.lng,
          address: shipment.load.destination.address,
        },
      },
      driver: shipment.driver
        ? {
            id: shipment.driver.id,
            firstName: shipment.driver.firstName,
            lastName: shipment.driver.lastName,
            phone: shipment.driver.phone,
          }
        : undefined,
      truck: {
        id: shipment.truck.id,
        licensePlate: shipment.truck.licensePlate,
        type: shipment.truck.type,
      },
      recentEvents: recentEvents.map(event => ({
        location: event.location,
        timestamp: event.createdAt,
        notes: event.notes,
      })),
    };
  }

  async getLocationHistory(
    shipmentId: string,
    userRole: string,
    userId: number,
    limit = 50,
  ): Promise<LocationHistory[]> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: [
        'load',
        'load.shipper',
        'load.shipper.user',
        'carrier',
        'carrier.user',
        'driver',
        'driver.user',
      ],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Authorization check
    if (userRole === 'shipper' && shipment.load.shipper.user.id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (userRole === 'carrier' && shipment.carrier.user.id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (userRole === 'driver' && (!shipment.driver || shipment.driver.user.id !== userId)) {
      throw new ForbiddenException('Access denied');
    }

    return await this.locationHistoryRepository.find({
      where: { shipment: { id: shipmentId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private calculateEstimatedArrival(
    shipment: Shipment,
    locationHistory: LocationHistory[],
  ): Date | undefined {
    if (!shipment.currentLocation || !shipment.load.destination) {
      return undefined;
    }

    // Simple calculation based on distance and average speed
    // You can enhance this with real route APIs like Google Maps or OpenStreetMap
    const distance = this.calculateDistance(
      shipment.currentLocation.lat,
      shipment.currentLocation.lng,
      shipment.load.destination.coordinates.lat,
      shipment.load.destination.coordinates.lng,
    );

    // Get average speed from recent location updates (default to 50 km/h if no data)
    const averageSpeed = this.calculateAverageSpeed(locationHistory) || 50;
    const timeToArrivalHours = distance / averageSpeed;

    const estimatedArrival = new Date();
    estimatedArrival.setHours(estimatedArrival.getHours() + timeToArrivalHours);

    return estimatedArrival;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateAverageSpeed(locationHistory: LocationHistory[]): number | null {
    if (locationHistory.length < 2) return null;

    let totalSpeed = 0;
    let speedReadings = 0;

    for (const entry of locationHistory) {
      if (entry.location.speed && entry.location.speed > 0) {
        totalSpeed += entry.location.speed;
        speedReadings++;
      }
    }

    return speedReadings > 0 ? totalSpeed / speedReadings : null;
  }
}
