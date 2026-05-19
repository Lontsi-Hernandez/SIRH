import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { CreateEmployeeCommand } from './create-employee.command';
import { Employee, EmployeeStatus, UserRole } from '../../../../domain/entities/employee.entity';

@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeHandler implements ICommandHandler<CreateEmployeeCommand> {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(command: CreateEmployeeCommand): Promise<Employee> {
    const { dto, tenantId } = command;

    // Vérifier l'unicité de l'email dans ce tenant
    const existing = await this.employeeRepository.findOne({
      where: { email: dto.email, tenantId },
    });

    if (existing) {
      throw new ConflictException(`Un employé avec l'email ${dto.email} existe déjà`);
    }

    // Générer le numéro d'employé
    const count = await this.employeeRepository.count({ where: { tenantId } });
    const employeeNumber = `EMP-${String(count + 1).padStart(4, '0')}`;

    const employee = this.employeeRepository.create({
      ...dto,
      employeeNumber,
      tenantId,
      status: EmployeeStatus.DRAFT,
      role: dto.role ?? UserRole.EMPLOYEE,
      hireDate: new Date(dto.hireDate),
    });

    return this.employeeRepository.save(employee);
  }
}
