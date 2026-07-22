import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { XuiClientBinding } from '../../xui-client-bindings/entities/xui-client-binding.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity()
@Index('ix_traffic_customer_time', ['customerId', 'collectedAt'])
@Index('ix_traffic_subscription_time', ['subscriptionId', 'collectedAt'])
@Index('ix_traffic_binding_time', ['bindingId', 'collectedAt'])
export class TrafficSnapshot {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  bindingId: string;

  @ManyToOne(() => XuiClientBinding, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'binding_id' })
  binding: XuiClientBinding;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ nullable: true })
  customerId?: string;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ type: 'bigint', default: 0 })
  upload: number;

  @Column({ type: 'bigint', default: 0 })
  download: number;

  @Column({ type: 'bigint', default: 0 })
  total: number;

  @Column({ type: 'timestamptz', nullable: true })
  sourceResetAt?: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  collectedAt: Date;
}
