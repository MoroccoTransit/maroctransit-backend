import { Bid } from '../entities/bid.entity';
import { BidStatus } from '../enums/bid-status.enum';

export class BidResponseDto {
  id: string;
  amount: number;
  status: BidStatus;
  proposedPickupDate: Date;
  proposedDeliveryDate: Date;
  notes?: string;

  load: {
    id: string;
    origin: any;
    destination: any;
    weight: number;
    budget: number;
  };

  carrier: {
    id: number;
    companyName: string;
  };

  truck: {
    id: string;
    licensePlate: string;
    type: string;
    capacity: number;
  };

  createdAt: Date;
  updatedAt: Date;

  constructor(bid: Bid) {
    this.id = bid.id;
    this.amount = Number(bid.amount);
    this.status = bid.status;
    this.proposedPickupDate = bid.proposedPickupDate;
    this.proposedDeliveryDate = bid.proposedDeliveryDate;
    this.notes = bid.notes;
    this.createdAt = bid.createdAt;
    this.updatedAt = bid.updatedAt;

    if (bid.load) {
      this.load = {
        id: bid.load.id,
        origin: bid.load.origin,
        destination: bid.load.destination,
        weight: bid.load.weight,
        budget: bid.load.budget,
      };
    }

    if (bid.carrier) {
      this.carrier = {
        id: bid.carrier.id,
        companyName: bid.carrier.companyName,
      };
    }

    if (bid.truck) {
      this.truck = {
        id: bid.truck.id,
        licensePlate: bid.truck.licensePlate,
        type: bid.truck.type,
        capacity: bid.truck.capacity,
      };
    }
  }
}
