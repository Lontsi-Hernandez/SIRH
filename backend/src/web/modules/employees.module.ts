import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Employee } from '../../domain/entities/employee.entity';
import { Tenant } from '../../domain/entities/tenant.entity';
import { EmployeesController } from '../controllers/employees.controller';

// Commands
import { CreateEmployeeHandler } from '../../application/employees/commands/create-employee/create-employee.handler';
import { UpdateEmployeeHandler } from '../../application/employees/commands/update-employee/update-employee.handler';
import { DeleteEmployeeHandler } from '../../application/employees/commands/delete-employee/delete-employee.handler';
import { OnboardEmployeeHandler } from '../../application/employees/commands/onboard-employee/onboard-employee.handler';
import { OffboardEmployeeHandler } from '../../application/employees/commands/offboard-employee/offboard-employee.handler';

// Queries
import { GetAllEmployeesHandler } from '../../application/employees/queries/get-all-employees/get-all-employees.handler';
import { GetEmployeeByIdHandler } from '../../application/employees/queries/get-employee-by-id/get-employee-by-id.handler';

const CommandHandlers = [
  CreateEmployeeHandler,
  UpdateEmployeeHandler,
  DeleteEmployeeHandler,
  OnboardEmployeeHandler,
  OffboardEmployeeHandler,
];
const QueryHandlers = [GetAllEmployeesHandler, GetEmployeeByIdHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Employee, Tenant]),
  ],
  controllers: [EmployeesController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [TypeOrmModule],
})
export class EmployeesModule {}

