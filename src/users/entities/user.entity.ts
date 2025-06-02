import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { PasswordResetToken } from './password-reset-token.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Role, role => role.users)
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => PasswordResetToken, token => token.user)
  passwordResetTokens: PasswordResetToken[];
}
