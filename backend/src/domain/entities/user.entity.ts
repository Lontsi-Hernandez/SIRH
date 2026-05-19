import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Tenant } from './tenant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'keycloak_id', unique: true, nullable: true })
  keycloakId?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin?: Date;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'employee_id', nullable: true })
  employeeId?: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clock_in', type: 'timestamptz' })
  clockIn: Date;

  @Column({ name: 'clock_out', type: 'timestamptz', nullable: true })
  clockOut?: Date;

  @Column({ name: 'clock_in_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  clockInLat?: number;

  @Column({ name: 'clock_in_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  clockInLng?: number;

  @Column({ name: 'clock_in_method', nullable: true })
  clockInMethod?: string;  // 'mobile', 'qr_code', 'web', 'geolocation'

  @Column({ name: 'is_manual', default: false })
  isManual: boolean;

  @Column({ nullable: true })
  notes?: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date;

  @Column({ name: 'attachment_url', nullable: true })
  attachmentUrl?: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'sender_id' })
  sender: Employee;

  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'recipient_id' })
  recipient: Employee;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'target_audience', default: 'ALL' })
  targetAudience: string;  // 'ALL', 'MANAGERS', 'EMPLOYEES', department_id

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'author_id' })
  author: Employee;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
