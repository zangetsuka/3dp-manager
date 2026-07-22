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

  @Column({ length: 120 })
  name: string;

  @Column({ length: 120, unique: true })
  slug: string;

  @Column({ length: 16, type: 'varchar' })
  type: RoutingProfileType;

  @Column({ type: 'text', nullable: true })
  sourceUrl?: string;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ length: 64, nullable: true })
  checksum?: string;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastFetchedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
