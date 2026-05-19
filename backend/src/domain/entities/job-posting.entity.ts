import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Employee } from './employee.entity';
import { Department } from './department.entity';
import { JobApplication } from './job-application.entity';

export enum RecruitmentStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  INTERVIEWING = 'INTERVIEWING',
  OFFER_SENT = 'OFFER_SENT',
  HIRED = 'HIRED',
  CLOSED = 'CLOSED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  INTERNSHIP = 'INTERNSHIP',
}

@Entity('job_postings')
export class JobPosting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ name: 'is_remote', default: false })
  isRemote: boolean;

  @Column({ name: 'employment_type', type: 'enum', enum: EmploymentType, default: EmploymentType.FULL_TIME })
  employmentType: EmploymentType;

  @Column({ name: 'salary_min', type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMin?: number;

  @Column({ name: 'salary_max', type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMax?: number;

  @Column({ type: 'enum', enum: RecruitmentStatus, default: RecruitmentStatus.OPEN })
  status: RecruitmentStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ name: 'closing_date', type: 'date', nullable: true })
  closingDate?: Date;

  @Column({ name: 'linkedin_job_id', nullable: true })
  linkedinJobId?: string;

  @Column({ name: 'indeed_job_id', nullable: true })
  indeedJobId?: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'recruiter_id' })
  recruiter?: Employee;

  @Column({ name: 'recruiter_id', nullable: true })
  recruiterId?: string;

  @OneToMany(() => JobApplication, (app) => app.jobPosting)
  applications?: JobApplication[];

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
