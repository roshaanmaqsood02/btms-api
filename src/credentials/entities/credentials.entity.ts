import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('credentials')
export class Credentials {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.credentials)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'credential_type' })
  credentialType: string; // OFFICIAL_EMAIL, VPN, GITHUB, JIRA, etc.

  @Column({ name: 'official_email', nullable: true })
  officialEmail: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string; // Should be encrypted in real application

  @Column({ nullable: true, name: 'account_url' })
  accountUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
