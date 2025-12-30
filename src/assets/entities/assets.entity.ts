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

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.assets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  type: string; // LAPTOP, MOBILE, MONITOR, ACCESSORY, etc.

  @Column({ name: 'asset_name' })
  assetName: string; // LAPTOP

  @Column({ nullable: true })
  company: string; // DELL

  @Column({ nullable: true })
  model: string; // Latitude 5400

  @Column({ name: 'serial_number', unique: true })
  serialNumber: string; // BKTS-OL122

  @Column({ nullable: true, name: 'screen_size' })
  screenSize: string; // 14 Inch

  @Column({ nullable: true })
  cpu: string; // Intel Core i5 8365 ~ 8th Gen

  @Column({ nullable: true })
  gpu: string; // Integrated

  @Column({ nullable: true })
  ram: string; // 16 GB

  @Column({ nullable: true, name: 'mac_address' })
  macAddress: string;

  @Column({ nullable: true })
  storage: string; // 256 GB

  @Column({ nullable: true, name: 'asset_tag' })
  assetTag: string;

  @Column({
    type: 'enum',
    enum: ['ASSIGNED', 'RETURNED', 'UNDER_REPAIR', 'LOST', 'DAMAGED'],
    default: 'ASSIGNED',
    name: 'asset_status',
  })
  assetStatus: 'ASSIGNED' | 'RETURNED' | 'UNDER_REPAIR' | 'LOST' | 'DAMAGED';

  @Column({ type: 'date', nullable: true, name: 'assigned_date' })
  assignedDate: Date;

  @Column({ type: 'date', nullable: true, name: 'return_date' })
  returnDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
