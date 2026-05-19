import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import { seedDatabase } from './persistence/seeds/database-seeder';

// ── Feature Modules ────────────────────────────────────────────────────────
import { AuthModule } from './web/modules/auth.module';
import { EmployeesModule } from './web/modules/employees.module';
import { DepartmentsModule } from './web/modules/departments.module';
import { ShiftsModule } from './web/modules/shifts.module';
import { LeavesModule } from './web/modules/leaves.module';
import { PayrollModule } from './web/modules/payroll.module';
import { RecruitmentModule } from './web/modules/recruitment.module';
import { PerformanceModule } from './web/modules/performance.module';
import { TrainingModule } from './web/modules/training.module';
import { NotificationsModule } from './web/modules/notifications.module';
import { AnalyticsModule } from './web/modules/analytics.module';
import { TenantsModule } from './web/modules/tenants.module';
import { HousingModule } from './web/modules/housing.module';

// ── Infrastructure ─────────────────────────────────────────────────────────
import { WebSocketGatewayModule } from './infrastructure/realtime/websocket.module';

// ── Domain Entities ────────────────────────────────────────────────────────
import { Employee } from './domain/entities/employee.entity';
import { Department } from './domain/entities/department.entity';
import { Position } from './domain/entities/position.entity';
import { Shift } from './domain/entities/shift.entity';
import { Leave } from './domain/entities/leave.entity';
import { Payroll } from './domain/entities/payroll.entity';
import { JobPosting } from './domain/entities/job-posting.entity';
import { JobApplication } from './domain/entities/job-application.entity';
import { Review, Goal } from './domain/entities/review.entity';
import { Training } from './domain/entities/training.entity';
import { Notification } from './domain/entities/notification.entity';
import { Tenant } from './domain/entities/tenant.entity';
import { User, TimeEntry, Message, Announcement } from './domain/entities/user.entity';
import { Housing, HousingAssignment } from './domain/entities/housing.entity';

@Module({
  imports: [
    // ── Configuration ──────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ── Base de données TypeORM ────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'hrms_user'),
        password: config.get('DB_PASSWORD', 'hrms_password'),
        database: config.get('DB_NAME', 'hrms_db'),
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
          Housing,
          HousingAssignment,
        ],
        migrations: ['dist/persistence/migrations/*.js'],
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true' || config.get('NODE_ENV') === 'development', // Activable via variable d'env
        logging: config.get('NODE_ENV') === 'development',
        ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),

    // ── Cache (mémoire en dev, Redis en production) ────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<any> => {
        const useRedis = config.get('USE_REDIS', 'false') === 'true';

        if (useRedis) {
          const { redisStore } = await import('cache-manager-redis-yet');
          return {
            store: await redisStore({
              socket: {
                host: config.get('REDIS_HOST', 'localhost'),
                port: config.get<number>('REDIS_PORT', 6379),
              },
              password: config.get('REDIS_PASSWORD'),
            }),
            ttl: 60 * 5,
          };
        }

        // Cache en mémoire pour le développement sans Redis
        return { ttl: 60 * 5, max: 1000 };
      },
    }),

    // ── Rate limiting ──────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 1000 },
    ]),

    // ── Scheduler ─────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Modules fonctionnels ───────────────────────────────────────────────
    TenantsModule,
    HousingModule,
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    ShiftsModule,
    LeavesModule,
    PayrollModule,
    RecruitmentModule,
    PerformanceModule,
    TrainingModule,
    NotificationsModule,
    AnalyticsModule,

    // ── Infrastructure ─────────────────────────────────────────────────────
    WebSocketGatewayModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      await seedDatabase(this.dataSource);
    } catch (error) {
      console.error('❌ Failed to run automatic database seeding on startup:', error);
    }
  }
}
