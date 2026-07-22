import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
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
    routingProfile?: string;
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
  @Column({ nullable: true })
  customerId?: string;

  @ManyToOne(() => Customer, (customer) => customer.subscriptions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  customer?: Customer;

  @Column({ nullable: true })
  groupId?: string;

  @ManyToOne(() => CustomerGroup, { nullable: true, onDelete: 'SET NULL' })
  group?: CustomerGroup;

  @Column({ nullable: true })
  routingProfileId?: string;

  @ManyToOne(() => RoutingProfile, { nullable: true, onDelete: 'SET NULL' })
  routingProfile?: RoutingProfile;

  @Column({ length: 160, nullable: true })
  publicToken?: string;

  @Column({ type: 'bigint', nullable: true })
  trafficLimit?: number;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
