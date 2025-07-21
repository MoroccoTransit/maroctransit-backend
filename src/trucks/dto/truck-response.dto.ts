import { TruckType } from '../enums/truck-type.enum';
import { TruckStatus } from '../enums/truck-status.enum';

export class TruckResponseDto {
  id: string;
  licensePlate: string;
  type: TruckType;
  capacity: number;
  carteGriseNumber: string;
  insuranceExpiryDate: Date;
  currentLocation: { lat: number; lng: number };
  status: TruckStatus;
  primaryImage: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  currentDriver?: any;

  constructor(truck: any) {
    this.id = truck.id;
    this.licensePlate = truck.licensePlate;
    this.type = truck.type;
    this.capacity = truck.capacity;
    this.carteGriseNumber = truck.carteGriseNumber;
    this.insuranceExpiryDate = truck.insuranceExpiryDate;
    this.currentLocation = truck.currentLocation;
    this.status = truck.status;
    this.primaryImage = truck.primaryImage;
    this.images = truck.images || [];
    this.createdAt = truck.createdAt;
    this.updatedAt = truck.updatedAt;
    this.currentDriver = truck.currentDriver;
  }
}
