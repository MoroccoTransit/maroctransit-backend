import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Load } from 'src/loads/entities/load.entity';
import { Truck } from 'src/trucks/entities/truck.entity';
import { Carrier } from 'src/users/entities/carrier.entity';
import { BidStatus } from '../enums/bid-status.enum';
@Entity()
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: BidStatus,
    default: BidStatus.PENDING,
  })
  status: BidStatus;

  @Column({ type: 'timestamp with time zone', comment: 'Morocco/Africa/Casablanca timezone' })
  proposedPickupDate: Date;

  @Column({ type: 'timestamp with time zone' })
  proposedDeliveryDate: Date;

  @ManyToOne(() => Load, load => load.bids)
  load: Load;

  @ManyToOne(() => Carrier, carrier => carrier.bids)
  carrier: Carrier;

  @ManyToOne(() => Truck)
  truck: Truck;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
