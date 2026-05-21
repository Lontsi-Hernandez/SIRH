import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Employee } from './employee.entity';
import { Branch } from './branch.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  code?: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @Column({ name: 'manager_id', nullable: true })
  managerId?: string;

  /** IDs des assistants-gérants (max 2) — stocké en JSON */
  @Column({ name: 'assistant_manager_ids', type: 'simple-json', nullable: true, default: '[]' })
  assistantManagerIds?: string[];

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'parent_department_id' })
  parentDepartment?: Department;

  @Column({ name: 'parent_department_id', nullable: true })
  parentDepartmentId?: string;

  @OneToMany(() => Department, (dept) => dept.parentDepartment)
  subDepartments?: Department[];

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
