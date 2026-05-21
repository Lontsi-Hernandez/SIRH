import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Employee } from '../domain/entities/employee.entity';
import { Department } from '../domain/entities/department.entity';
import { Position } from '../domain/entities/position.entity';
import { Shift } from '../domain/entities/shift.entity';
import { Leave } from '../domain/entities/leave.entity';
import { Payroll } from '../domain/entities/payroll.entity';
import { JobPosting } from '../domain/entities/job-posting.entity';
import { JobApplication } from '../domain/entities/job-application.entity';
import { Review, Goal } from '../domain/entities/review.entity';
import { Training } from '../domain/entities/training.entity';
import { Notification } from '../domain/entities/notification.entity';
import { Tenant } from '../domain/entities/tenant.entity';
import { User, TimeEntry, Message, Announcement } from '../domain/entities/user.entity';
import { Branch } from '../domain/entities/branch.entity';
import { Housing, HousingAssignment } from '../domain/entities/housing.entity';

import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'hrms_user',
  password: process.env.DB_PASSWORD || 'hrms_password',
  database: process.env.DB_NAME || 'hrms_db',
  entities: [
    Employee,
    Department,
    Position,
    Shift,
    Leave,
    Payroll,
    JobPosting,
    JobApplication,
    Review,
    Goal,
    Training,
    Notification,
    Tenant,
    User,
    TimeEntry,
    Message,
    Announcement,
    Branch,
    Housing,
    HousingAssignment,
  ],
  migrations: ['src/persistence/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
