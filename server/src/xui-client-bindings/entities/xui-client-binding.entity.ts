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

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ name: 'node_id', nullable: true })
  nodeId?: string;

  @ManyToOne(() => Node, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'node_id' })
  node?: Node;

  @Column({ name: 'inbound_id', type: 'int', nullable: true })
  inboundId?: number;

  @ManyToOne(() => Inbound, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inbound_id' })
  inbound?: Inbound;

  @Column({ length: 32 })
  protocol: string;

  @Column({ name: 'xui_inbound_id', type: 'int', nullable: true })
  xuiInboundId?: number;

  @Column({ name: 'xui_client_id', length: 128 })
  xuiClientId: string;

  @Index('ix_binding_email')
  @Column({ name: 'xui_email', length: 255 })
  xuiEmail: string;

  @Column({ name: 'xui_sub_id', length: 255, nullable: true })
  xuiSubId?: string;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
