import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Tenant } from '../../domain/entities/tenant.entity';
import { Employee } from '../../domain/entities/employee.entity';
import { User } from '../../domain/entities/user.entity';
import { Branch } from '../../domain/entities/branch.entity';
import { TenantsController } from '../controllers/tenants.controller';
import { TenantsService } from '../services/tenants.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Tenant, Employee, User, Branch]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TypeOrmModule, TenantsService],
})
export class TenantsModule {}
