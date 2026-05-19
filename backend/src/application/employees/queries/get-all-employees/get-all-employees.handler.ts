import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { GetAllEmployeesQuery } from './get-all-employees.query';
import { Employee } from '../../../../domain/entities/employee.entity';

@QueryHandler(GetAllEmployeesQuery)
export class GetAllEmployeesHandler implements IQueryHandler<GetAllEmployeesQuery> {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(query: GetAllEmployeesQuery) {
    const { tenantId, filters } = query;
    const { page = 1, limit = 20, search, departmentId, status, role } = filters;

    const where: any = { tenantId };

    if (status) where.status = status;
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;

    const options: FindManyOptions<Employee> = {
      where: search
        ? [
            { ...where, firstName: Like(`%${search}%`) },
            { ...where, lastName: Like(`%${search}%`) },
            { ...where, email: Like(`%${search}%`) },
            { ...where, employeeNumber: Like(`%${search}%`) },
          ]
        : where,
      relations: ['department', 'position', 'manager'],
      order: { lastName: 'ASC', firstName: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [employees, total] = await this.employeeRepository.findAndCount(options);

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
