import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Tenant } from './tenant.entity';

export enum NotificationType {
  SHIFT_CHANGE = 'SHIFT_CHANGE',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  PAYROLL_READY = 'PAYROLL_READY',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  REVIEW_DUE = 'REVIEW_DUE',
  DOCUMENT_SHARED = 'DOCUMENT_SHARED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date;

  @Column({ name: 'action_url', nullable: true })
  actionUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'recipient_id' })
  recipient: Employee;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender?: Employee;

  @Column({ name: 'sender_id', nullable: true })
  senderId?: string;

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
