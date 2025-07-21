import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Shipper } from 'src/users/entities/shipper.entity';
import { Bid } from 'src/bids/entities/bid.entity';
import { LoadStatus } from '../enums/load-status.enum';
import { CargoType } from '../enums/cargo-type.enum';
import { DimensionUnit } from '../enums/dimension-unit.enum';
import { WeightUnit } from '../enums/weight-unit.enum';
@Entity()
export class Load {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json' })
  origin: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };

  @Column({ type: 'json' })
  destination: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };

  @Column({ type: 'float' })
  weight: number;

  @Column({
    type: 'enum',
    enum: WeightUnit,
    default: WeightUnit.KILOGRAM,
  })
  weightUnit: WeightUnit;

  @Column({ type: 'json', comment: 'Dimensions in meters { length: 10, width: 2.5, height: 3 }' })
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: DimensionUnit;
  };

  @Column('text', { array: true, default: ['general'] })
  cargoTypes: CargoType[];

  @Column({ default: 'draft' })
  status: LoadStatus;

  @Column({ type: 'timestamp' })
  pickupDate: Date;

  @Column({ type: 'timestamp' })
  deliveryDeadline: Date;

  @Column({ type: 'float', comment: 'Shipper’s budget in MAD (Moroccan Dirham)' })
  budget: number;

  @Column({ type: 'float', nullable: true, comment: 'Accepted bid amount' })
  acceptedBidAmount: number;

  @ManyToOne(() => Shipper, shipper => shipper.loads)
  shipper: Shipper;

  @OneToMany(() => Bid, bid => bid.load)
  bids: Bid[];

  @Column({ nullable: true })
  description: string;

  @OneToOne(() => Bid, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  acceptedBid: Bid;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
