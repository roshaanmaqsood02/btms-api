import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('employee_contracts')
export class EmployeeContract {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.contracts, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: ['EMPLOYEED', 'TERMINATED', 'RESIGNED', 'ON_LEAVE', 'PROBATION'],
    default: 'EMPLOYEED',
    name: 'employee_status',
  })
  employeeStatus:
    | 'EMPLOYEED'
    | 'TERMINATED'
    | 'RESIGNED'
    | 'ON_LEAVE'
    | 'PROBATION';

  @Column({
    type: 'enum',
    enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'],
    default: 'FULL_TIME',
    name: 'job_type',
  })
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  designation: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true, name: 'reporting_hr' })
  reportingHr: string;

  @Column({ nullable: true, name: 'reporting_manager' })
  reportingManager: string;

  @Column({ nullable: true, name: 'reporting_team_lead' })
  reportingTeamLead: string;

  @Column({ type: 'date', nullable: true, name: 'joining_date' })
  joiningDate: Date;

  @Column({ type: 'date', nullable: true, name: 'contract_start' })
  contractStart: Date;

  @Column({ type: 'date', nullable: true, name: 'contract_end' })
  contractEnd: Date;

  @Column({
    type: 'enum',
    enum: ['MORNING', 'EVENING', 'NIGHT', 'ROTATIONAL'],
    nullable: true,
  })
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'ROTATIONAL';

  @Column({
    type: 'enum',
    enum: ['ON_SITE', 'REMOTE', 'HYBRID'],
    default: 'ON_SITE',
    name: 'work_location',
  })
  workLocation: 'ON_SITE' | 'REMOTE' | 'HYBRID';

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
