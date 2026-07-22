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

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ name: 'telegram_id', length: 64, nullable: true })
  telegramId?: string;

  @Column({ length: 16, default: 'active' })
  status: CustomerStatus;

  @Column({ name: 'traffic_limit', type: 'bigint', nullable: true })
  trafficLimit?: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => Subscription, (sub) => sub.customer)
  subscriptions: Subscription[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
