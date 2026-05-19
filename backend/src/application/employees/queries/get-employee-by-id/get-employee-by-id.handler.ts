import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetEmployeeByIdQuery } from './get-employee-by-id.query';
import { Employee } from '../../../../domain/entities/employee.entity';

@QueryHandler(GetEmployeeByIdQuery)
export class GetEmployeeByIdHandler implements IQueryHandler<GetEmployeeByIdQuery> {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(query: GetEmployeeByIdQuery): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id: query.id, tenantId: query.tenantId },
      relations: ['department', 'position', 'manager', 'subordinates'],
    });

    if (!employee) {
      throw new NotFoundException(`Employé ${query.id} introuvable`);
    }

    return employee;
  }
}
