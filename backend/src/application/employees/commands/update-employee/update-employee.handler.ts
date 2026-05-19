import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateEmployeeCommand } from './update-employee.command';
import { Employee, EmployeeStatus } from '../../../../domain/entities/employee.entity';

export function validateStateTransition(current: EmployeeStatus, target: EmployeeStatus): void {
  const allowed: Record<EmployeeStatus, EmployeeStatus[]> = {
    [EmployeeStatus.DRAFT]: [EmployeeStatus.ACTIVE],
    [EmployeeStatus.ACTIVE]: [EmployeeStatus.SUSPENDED, EmployeeStatus.TERMINATED],
    [EmployeeStatus.SUSPENDED]: [EmployeeStatus.ACTIVE, EmployeeStatus.TERMINATED],
    [EmployeeStatus.TERMINATED]: [EmployeeStatus.ARCHIVED],
    [EmployeeStatus.ARCHIVED]: [],
  };

  if (!allowed[current].includes(target)) {
    throw new BadRequestException(
      `Transition de statut invalide : Impossible de passer de ${current} à ${target}`,
    );
  }
}

@CommandHandler(UpdateEmployeeCommand)
export class UpdateEmployeeHandler implements ICommandHandler<UpdateEmployeeCommand> {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(command: UpdateEmployeeCommand): Promise<Employee> {
    const { id, dto, tenantId } = command;
    const employee = await this.employeeRepository.findOne({ where: { id, tenantId } });

    if (!employee) throw new NotFoundException(`Employé ${id} introuvable`);

    if (dto.status && dto.status !== employee.status) {
      validateStateTransition(employee.status, dto.status);
    }

    Object.assign(employee, dto);
    return this.employeeRepository.save(employee);
  }
}

