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
import { Truck } from 'src/trucks/entities/truck.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { User } from 'src/users/entities/user.entity';
import { DriverStatus } from '../enums/driver-status.enum';

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

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.AVAILABLE,
    comment: 'Current availability status of the driver',
  })
  status: DriverStatus;

  @OneToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Carrier, carrier => carrier.drivers)
  carrier: Carrier;

  @OneToOne(() => Truck, truck => truck.currentDriver, { nullable: true })
  assignedTruck: Truck | null;

  @OneToMany(() => Shipment, shipment => shipment.driver)
  shipments: Shipment[];

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  lastUpdatedAt: Date;
}
