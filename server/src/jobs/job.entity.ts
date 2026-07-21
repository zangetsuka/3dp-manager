import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type JobType = 'rotation' | 'relay_install' | 'relay_delete';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  type: JobType;

  @Column({ default: 'pending' })
  status: JobStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  payload: string;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}
