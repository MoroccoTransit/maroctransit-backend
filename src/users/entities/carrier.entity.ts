import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Carrier {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  companyName: string;

  @Column()
  vehicleType: string;

  @Column()
  vehicleRegistrationPath: string;

  @Column()
  maxLoadCapacity: string;

  @Column()
  insuranceDocPath: string;

  @Column('simple-array')
  certifications: string[];

  @Column()
  serviceAreas: string;

  @Column()
  driverLicensePath: string;

  @Column()
  availabilitySchedule: string;
}
