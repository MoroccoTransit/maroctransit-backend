import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { Truck } from '../../trucks/entities/truck.entity';

@Entity()
@Index(['shipment', 'createdAt'])
@Index(['truck', 'createdAt'])
export class LocationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'json',
    comment: 'GPS coordinates with accuracy and timestamp',
  })
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };

  @Column({
    type: 'timestamp with time zone',
    comment: 'Timestamp when location was recorded',
  })
  recordedAt: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Additional notes or context',
  })
  notes: string;

  @ManyToOne(() => Shipment, { onDelete: 'CASCADE' })
  shipment: Shipment;

  @ManyToOne(() => Truck, { onDelete: 'CASCADE' })
  truck: Truck;

  @CreateDateColumn()
  createdAt: Date;
}
