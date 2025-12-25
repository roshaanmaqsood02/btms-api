import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  password: string;

  /* -------------------------------------------------------------------------- */
  /*                              Employee Details                              */
  /* -------------------------------------------------------------------------- */

  @Index({ unique: true })
  @Column({ name: 'employee_id' })
  employeeId: string;

  @Index({ unique: true })
  @Column({ name: 'attendance_id', nullable: true })
  attendanceId?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  gender?: string;

  // Personal Details
  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  dateOfBirth?: Date;

  @Column({ nullable: true, name: 'blood_group' })
  bloodGroup?: string;

  @Index({ unique: true })
  @Column({ nullable: true, name: 'cnic' })
  cnic?: string;

  @Column({ nullable: true, name: 'marital_status' })
  maritalStatus?: string;

  // Contact Details
  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, name: 'postal_code' })
  postalCode?: string;

  // Professional Details
  @Column({ nullable: true })
  department?: string;

  @Column('simple-array', { nullable: true })
  projects?: string[];

  @Column('simple-array', { nullable: true })
  positions?: string[];

  @Column({ nullable: true, name: 'profile_pic' })
  profilePic?: string;

  /* -------------------------------------------------------------------------- */
  /*                                   System                                   */
  /* -------------------------------------------------------------------------- */

  @Column({
    type: 'enum',
    enum: [
      'EMPLOYEE',
      'PROJECT_MANAGER',
      'OPERATION_MANAGER',
      'HRM',
      'ADMIN',
      'CEO',
      'CTO',
      'STAFF',
      'INTERNS',
    ],
    default: 'EMPLOYEE',
    name: 'system_role',
  })
  systemRole:
    | 'EMPLOYEE'
    | 'PROJECT_MANAGER'
    | 'OPERATION_MANAGER'
    | 'HRM'
    | 'ADMIN'
    | 'CEO'
    | 'CTO'
    | 'STAFF'
    | 'INTERNS';

  @Index({ unique: true })
  @Column()
  uuid: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
