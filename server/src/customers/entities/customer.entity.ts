import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

export enum CustomerStatus {
  Active = 'active',
  Paused = 'paused',
  Blocked = 'blocked',
  Expired = 'expired',
}

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 120, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 64, nullable: true })
  telegramId?: string;

  @Column({ length: 16, default: 'active' })
  status: CustomerStatus;

  @Column({ type: 'bigint', nullable: true })
  trafficLimit?: number;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => Subscription, (sub) => sub.customer)
  subscriptions: Subscription[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
