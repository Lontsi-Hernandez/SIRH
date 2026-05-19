import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;       // ex: "acme-corp"

  @Column()
  name: string;       // ex: "Acme Corporation"

  @Column({ nullable: true })
  industry?: string;  // ex: "restauration", "retail", "santé"

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone?: string;

  @Column({ name: 'address', nullable: true })
  address?: string;

  @Column({ name: 'province', default: 'QC' })
  province: string;   // Conformité légale québécoise/canadienne

  @Column({ name: 'keycloak_realm', nullable: true })
  keycloakRealm?: string;

  @Column({ name: 'max_employees', default: 100 })
  maxEmployees: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'subscription_plan', default: 'starter' })
  subscriptionPlan: string;  // 'starter', 'growth', 'enterprise'

  @Column({ name: 'subscription_expires_at', type: 'timestamptz', nullable: true })
  subscriptionExpiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;  // Paramètres personnalisables par tenant

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
