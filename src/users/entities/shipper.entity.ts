import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Load } from 'src/loads/entities/load.entity';
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
  @OneToMany(() => Load, load => load.shipper)
  loads: Load[];
}
