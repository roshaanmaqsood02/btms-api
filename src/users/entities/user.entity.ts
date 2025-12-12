// user.entity.ts (temporary fix)
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true, nullable: true })
  uuid: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  // Temporarily comment out refreshToken
  // @Column({ name: 'refresh_token', nullable: true, type: 'varchar' })
  // refreshToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  // Temporarily comment out updatedAt
  // @UpdateDateColumn()
  // updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = uuidv4();
    }
  }
}
