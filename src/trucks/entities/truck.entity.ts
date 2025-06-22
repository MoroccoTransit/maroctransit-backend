import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Carrier } from 'src/users/entities/carrier.entity';
import { TruckType } from '../enums/truck-type.enum';
import { Driver } from 'src/drivers/entities/driver.entity';

@Entity()
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  licensePlate: string;

  @Column({ type: 'enum', enum: TruckType })
  type: TruckType;

  @Column({ type: 'float', comment: 'Maximum cargo weight in tons' })
  capacity: number;

  @Column({ comment: 'Moroccan vehicle registration number (Carte Grise)' })
  carteGriseNumber: string;

  @Column({ type: 'date', comment: 'Insurance expiry date (required by law)' })
  insuranceExpiryDate: Date;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'GPS coordinates (e.g., {"lat": 33.5731, "lng": -7.5898})',
  })
  currentLocation: { lat: number; lng: number };

  @Column({ default: true })
  isAvailable: boolean;

  @ManyToOne(() => Carrier, carrier => carrier.trucks)
  carrier: Carrier;

  @OneToOne(() => Driver, { nullable: true })
  @JoinColumn()
  currentDriver: Driver | null;

  @Column({
    nullable: true,
    comment: 'URL of the primary truck photo (e.g., stored in AWS S3 or local storage)',
  })
  primaryImage: string;

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Array of image URLs (side, rear, cargo area, etc.)',
  })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
