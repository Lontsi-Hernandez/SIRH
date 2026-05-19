import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { JobPosting } from '../../domain/entities/job-posting.entity';
import { JobApplication } from '../../domain/entities/job-application.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([JobPosting, JobApplication])], exports: [TypeOrmModule] })
export class RecruitmentModule {}
