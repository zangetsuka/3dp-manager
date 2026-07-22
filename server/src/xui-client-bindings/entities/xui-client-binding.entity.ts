import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Node } from '../../nodes/entities/node.entity';
import { Inbound } from '../../inbounds/entities/inbound.entity';

@Entity()
@Unique(['nodeId', 'xuiEmail'])
export class XuiClientBinding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ nullable: true })
  nodeId?: string;

  @ManyToOne(() => Node, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'node_id' })
  node?: Node;

  @Column({ type: 'int', nullable: true })
  inboundId?: number;

  @ManyToOne(() => Inbound, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inbound_id' })
  inbound?: Inbound;

  @Column({ length: 32 })
  protocol: string;

  @Column({ type: 'int', nullable: true })
  xuiInboundId?: number;

  @Column({ length: 128 })
  xuiClientId: string;

  @Index('ix_binding_email')
  @Column({ length: 255 })
  xuiEmail: string;

  @Column({ length: 255, nullable: true })
  xuiSubId?: string;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

}
