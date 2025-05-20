import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Carrier } from 'src/users/entities/carrier.entity';
import { ShipmentStatus } from '../enums/shipment-status.enum';
import { Load } from 'src/loads/entities/load.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Truck } from 'src/trucks/entities/truck.entity';
import { Bid } from 'src/bids/entities/bid.entity';

@Entity()
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json', nullable: true })
  currentLocation: { lat: number; lng: number };

  @Column({ default: 'pending' })
  status: ShipmentStatus;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  estimatedDeliveryDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryDate: Date;

  @OneToOne(() => Load)
  @JoinColumn()
  load: Load;

  @ManyToOne(() => Carrier)
  carrier: Carrier;

  @ManyToOne(() => Driver, driver => driver.shipments)
  driver: Driver;

  @OneToOne(() => Bid)
  bid: Bid;

  @ManyToOne(() => Truck)
  truck: Truck;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
