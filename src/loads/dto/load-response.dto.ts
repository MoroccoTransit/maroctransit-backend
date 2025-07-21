import { Load } from '../entities/load.entity';
import { LoadStatus } from '../enums/load-status.enum';
import { CargoType } from '../enums/cargo-type.enum';
import { WeightUnit } from '../enums/weight-unit.enum';
import { DimensionUnit } from '../enums/dimension-unit.enum';

export class LoadResponseDto {
  id: string;

  origin: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };

  destination: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };

  weight: number;
  weightUnit: WeightUnit;

  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: DimensionUnit;
  };

  cargoTypes: CargoType[];
  status: LoadStatus;
  pickupDate: Date;
  deliveryDeadline: Date;
  budget: number;
  acceptedBidAmount?: number;
  description?: string;

  // Shipper info (for carriers)
  shipper?: {
    id: number;
    businessName: string;
    taxId: string;
  };

  // Accepted bid info (for shippers)
  acceptedBid?: {
    id: string;
    amount: number;
    carrier: {
      id: number;
      companyName: string;
    };
  };

  createdAt: Date;
  updatedAt: Date;

  constructor(load: Load) {
    this.id = load.id;
    this.origin = load.origin;
    this.destination = load.destination;
    this.weight = load.weight;
    this.weightUnit = load.weightUnit;
    this.dimensions = load.dimensions;
    this.cargoTypes = load.cargoTypes;
    this.status = load.status;
    this.pickupDate = load.pickupDate;
    this.deliveryDeadline = load.deliveryDeadline;
    this.budget = load.budget;
    this.acceptedBidAmount = load.acceptedBidAmount;
    this.description = load.description;
    this.createdAt = load.createdAt;
    this.updatedAt = load.updatedAt;

    if (load.shipper) {
      this.shipper = {
        id: load.shipper.id,
        businessName: load.shipper.businessName,
        taxId: load.shipper.taxId,
      };
    }

    if (load.acceptedBid) {
      this.acceptedBid = {
        id: load.acceptedBid.id,
        amount: Number(load.acceptedBid.amount),
        carrier: {
          id: load.acceptedBid.carrier.id,
          companyName: load.acceptedBid.carrier.companyName,
        },
      };
    }
  }
}
