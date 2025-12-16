// src/users/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, name: 'postal_code' })
  postalCode?: string;

  @Column({ nullable: true })
  department?: string;

  @Column('simple-array', { nullable: true })
  projects?: string[];

  @Column('simple-array', { nullable: true })
  positions?: string[];

  @Column({ nullable: true, name: 'profile_pic' })
  profilePic?: string;

  @Column()
  uuid: string;

  @CreateDateColumn()
  createdAt: Date;
}
