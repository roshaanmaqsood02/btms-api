import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('educations')
export class Education {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.educations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'int', name: 'start_year' })
  startYear: number;

  @Column({ type: 'int', name: 'end_year' })
  endYear: number;

  @Column()
  degree: string;

  @Column({ nullable: true, name: 'field_of_study' })
  fieldOfStudy: string;

  @Column()
  institution: string;

  @Column({ nullable: true })
  grade: string;

  @Column({ nullable: true, name: 'grade_scale' })
  gradeScale: string; // e.g., "4.0", "100%", "CGPA"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false, name: 'is_current' })
  isCurrent: boolean;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;
}
