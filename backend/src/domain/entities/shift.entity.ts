import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Tenant } from './tenant.entity';

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABSENT = 'ABSENT',
  CANCELLED = 'CANCELLED',
}

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ name: 'actual_start_time', type: 'timestamptz', nullable: true })
  actualStartTime?: Date;

  @Column({ name: 'actual_end_time', type: 'timestamptz', nullable: true })
  actualEndTime?: Date;

  @Column({ type: 'enum', enum: ShiftStatus, default: ShiftStatus.SCHEDULED })
  status: ShiftStatus;

  @Column({ nullable: true })
  location?: string;

  @Column({ name: 'location_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLat?: number;

  @Column({ name: 'location_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLng?: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ name: 'is_overtime', default: false })
  isOvertime: boolean;

  @Column({ name: 'overtime_rate', type: 'decimal', precision: 5, scale: 2, default: 1.5 })
  overtimeRate: number;

  @Column({ name: 'break_duration_minutes', default: 0 })
  breakDurationMinutes: number;

  @ManyToOne(() => Employee, (emp) => emp.shifts)
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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get durationHours(): number {
    const ms = this.endTime.getTime() - this.startTime.getTime();
    return ms / (1000 * 60 * 60);
  }
}
