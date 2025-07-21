export class TrackingInfoDto {
  shipmentId: string;
  truckId: string;
  currentLocation: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
  lastUpdate: Date;
  status: string;
  estimatedArrival?: Date;
  route?: {
    origin: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  truck?: {
    id: string;
    licensePlate: string;
    type: string;
  };
  recentEvents?: Array<{
    location: { lat: number; lng: number };
    timestamp: Date;
    notes?: string;
  }>;
}
