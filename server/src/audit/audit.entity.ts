import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  action: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  detail: string;

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
}
