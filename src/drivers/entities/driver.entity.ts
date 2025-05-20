import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Carrier } from 'src/users/entities/carrier.entity';
import { Truck } from '../../trucks/entities/truck.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';

@Entity()
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  cin: string;

  @Column({ unique: true, comment: 'Moroccan format: +2126XXXXXXXX' })
  phone: string;

  @Column()
  address: string;

  @Column({ unique: true })
  licenseNumber: string;

  @Column({ type: 'date' })
  licenseExpiryDate: Date;

  @Column({ default: true })
  isAvailable: boolean;

  @ManyToOne(() => Carrier, carrier => carrier.drivers)
  carrier: Carrier;

  @OneToOne(() => Truck, truck => truck.currentDriver)
  @JoinColumn()
  truck: Truck;

  @OneToMany(() => Shipment, shipment => shipment.driver)
  shipments: Shipment[];

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  lastUpdatedAt: Date;
}
