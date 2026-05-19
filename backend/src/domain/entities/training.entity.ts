import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, ManyToMany, JoinTable, JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Tenant } from './tenant.entity';

@Entity('trainings')
export class Training {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true })
  category?: string;  // ex: "sécurité", "compétences", "leadership"

  @Column({ name: 'duration_hours', type: 'decimal', precision: 6, scale: 1, nullable: true })
  durationHours?: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'is_mandatory', default: false })
  isMandatory: boolean;

  @Column({ name: 'certificate_validity_months', nullable: true })
  certificateValidityMonths?: number;

  @Column({ name: 'max_participants', nullable: true })
  maxParticipants?: number;

  @Column({ name: 'material_url', nullable: true })
  materialUrl?: string;

  @Column({ name: 'online_url', nullable: true })
  onlineUrl?: string;

  @ManyToMany(() => Employee)
  @JoinTable({
    name: 'training_enrollments',
    joinColumn: { name: 'training_id' },
    inverseJoinColumn: { name: 'employee_id' },
  })
  participants?: Employee[];

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
