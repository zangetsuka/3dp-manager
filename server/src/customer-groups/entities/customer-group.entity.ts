import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoutingProfile } from '../../routing-profiles/entities/routing-profile.entity';

@Entity()
export class CustomerGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'default_routing_profile_id', nullable: true })
  defaultRoutingProfileId?: string;

  @ManyToOne(() => RoutingProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_routing_profile_id' })
  defaultRoutingProfile?: RoutingProfile;

  @Column({ name: 'default_traffic_limit', type: 'bigint', nullable: true })
  defaultTrafficLimit?: number;

  @Column({ name: 'default_expiry_days', type: 'int', nullable: true })
  defaultExpiryDays?: number;

  @Column({ name: 'default_auto_rotation', default: true })
  defaultAutoRotation: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
