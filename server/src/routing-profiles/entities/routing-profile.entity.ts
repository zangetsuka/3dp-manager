import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RoutingProfileType {
  Builtin = 'builtin',
  Remote = 'remote',
  Custom = 'custom',
}

@Entity()
export class RoutingProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ length: 16 })
  type: RoutingProfileType;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl?: string;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ length: 64, nullable: true })
  checksum?: string;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ name: 'last_fetched_at', type: 'timestamptz', nullable: true })
  lastFetchedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
