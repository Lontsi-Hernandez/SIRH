import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Department } from '../../domain/entities/department.entity';
import { Employee } from '../../domain/entities/employee.entity';
import { DepartmentsService } from '../services/departments.service';
import { DepartmentsController } from '../controllers/departments.controller';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Department, Employee])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService, TypeOrmModule],
})
export class DepartmentsModule {}

