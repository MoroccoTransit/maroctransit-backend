import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Truck } from 'src/trucks/entities/truck.entity';
import { Bid } from 'src/bids/entities/bid.entity';
import { Driver } from 'src/drivers/entities/driver.entity';

@Entity()
export class Carrier {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  companyName: string;

  @Column({ length: 30 })
  ice: string;

  @Column()
  rcNumber: string;

  @Column()
  transportLicenseNumber: string;

  @Column()
  insurancePolicyNumber: string;

  @Column({ type: 'date' })
  insuranceExpiryDate: Date;

  @Column()
  availabilitySchedule: string;

  @OneToMany(() => Truck, truck => truck.carrier)
  trucks: Truck[];

  @OneToMany(() => Bid, bid => bid.carrier)
  bids: Bid[];

  @OneToMany(() => Driver, driver => driver.carrier)
  drivers: Driver[];
}
