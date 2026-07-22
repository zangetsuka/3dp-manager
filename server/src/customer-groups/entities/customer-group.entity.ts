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

  @Column({ length: 120 })
  name: string;

  @Column({ length: 120, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  defaultRoutingProfileId?: string;

  @ManyToOne(() => RoutingProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_routing_profile_id' })
  defaultRoutingProfile?: RoutingProfile;

  @Column({ type: 'bigint', nullable: true })
  defaultTrafficLimit?: number;

  @Column({ type: 'int', nullable: true })
  defaultExpiryDays?: number;

  @Column({ default: true })
  defaultAutoRotation: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
