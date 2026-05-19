import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Tenant } from './tenant.entity';

export enum HousingAssignmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('housings')
export class Housing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ name: 'postal_code' })
  postalCode: string;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ name: 'monthly_rent', type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyRent: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => HousingAssignment, (assignment) => assignment.housing)
  assignments: HousingAssignment[];

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

@Entity('housing_assignments')
export class HousingAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Housing, (housing) => housing.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'housing_id' })
  housing: Housing;

  @Column({ name: 'housing_id' })
  housingId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'rent_deduction_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  rentDeductionAmount: number;

  @Column({
    type: 'enum',
    enum: HousingAssignmentStatus,
    default: HousingAssignmentStatus.ACTIVE,
  })
  status: HousingAssignmentStatus;

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
