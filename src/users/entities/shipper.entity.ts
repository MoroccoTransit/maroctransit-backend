import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Shipper {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  businessName: string;

  @Column()
  taxId: string;

  @Column()
  companyRegistrationDocPath: string;

  @Column()
  emergencyContact: string;
}
