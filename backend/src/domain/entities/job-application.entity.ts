import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { JobPosting } from './job-posting.entity';
import { Employee } from './employee.entity';
import { Tenant } from './tenant.entity';

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  ASSESSMENT = 'ASSESSMENT',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

@Entity('job_applications')
export class JobApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'applicant_name' })
  applicantName: string;

  @Column({ name: 'applicant_email' })
  applicantEmail: string;

  @Column({ name: 'applicant_phone', nullable: true })
  applicantPhone?: string;

  @Column({ name: 'resume_url', nullable: true })
  resumeUrl?: string;

  @Column({ name: 'cover_letter', type: 'text', nullable: true })
  coverLetter?: string;

  @Column({ name: 'linkedin_profile', nullable: true })
  linkedinProfile?: string;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.APPLIED })
  status: ApplicationStatus;

  @Column({ name: 'interview_date', type: 'timestamptz', nullable: true })
  interviewDate?: Date;

  @Column({ name: 'interview_notes', type: 'text', nullable: true })
  interviewNotes?: string;

  @Column({ name: 'score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason?: string;

  @ManyToOne(() => JobPosting, (posting) => posting.applications)
  @JoinColumn({ name: 'job_posting_id' })
  jobPosting: JobPosting;

  @Column({ name: 'job_posting_id' })
  jobPostingId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: Employee;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId?: string;

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
