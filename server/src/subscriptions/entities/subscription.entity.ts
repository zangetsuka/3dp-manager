import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Inbound } from '../../inbounds/entities/inbound.entity';
import { Node } from '../../nodes/entities/node.entity';
import { Tunnel } from '../../tunnels/entities/tunnel.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerGroup } from '../../customer-groups/entities/customer-group.entity';
import { RoutingProfile } from '../../routing-profiles/entities/routing-profile.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  uuid: string;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ default: true })
  isAutoRotationEnabled: boolean;

  @Column({ type: 'simple-json', nullable: true })
  inboundsConfig: Array<{
    type?: string;
    port?: number | string;
    sni?: string;
    link?: string;
    nodeId?: string;
    relayServerId?: number;
    flag?: string;
    name?: string;
    certificateFile?: string;
    keyFile?: string;
  }>;

  @Column({ nullable: true })
  nodeId?: string;

  @ManyToOne(() => Node, (node) => node.subscriptions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  node?: Node;

  @Column({ nullable: true })
  relayServerId?: number;

  @ManyToOne(() => Tunnel, { nullable: true, onDelete: 'SET NULL' })
  relayServer?: Tunnel;

  @OneToMany(() => Inbound, (inbound) => inbound.subscription)
  inbounds: Inbound[];

  // V2 fields
  @Column({ name: 'customer_id', nullable: true })
  customerId?: string;

  @ManyToOne(() => Customer, (customer) => customer.subscriptions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ name: 'group_id', nullable: true })
  groupId?: string;

  @ManyToOne(() => CustomerGroup, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'group_id' })
  group?: CustomerGroup;

  @Column({ name: 'routing_profile_id', nullable: true })
  routingProfileId?: string;

  @ManyToOne(() => RoutingProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'routing_profile_id' })
  routingProfile?: RoutingProfile;

  @Column({ name: 'public_token', length: 160, nullable: true })
  publicToken?: string;

  @Column({ name: 'traffic_limit', type: 'bigint', nullable: true })
  trafficLimit?: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
