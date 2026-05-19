import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OnboardEmployeeCommand } from './onboard-employee.command';
import { Employee, EmployeeStatus } from '../../../../domain/entities/employee.entity';
import { validateStateTransition } from '../update-employee/update-employee.handler';

@CommandHandler(OnboardEmployeeCommand)
export class OnboardEmployeeHandler implements ICommandHandler<OnboardEmployeeCommand> {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(command: OnboardEmployeeCommand): Promise<Employee> {
    const { id, tenantId } = command;
    const employee = await this.employeeRepository.findOne({ where: { id, tenantId } });

    if (!employee) throw new NotFoundException(`Employé ${id} introuvable`);

    // Valider le passage de l'état actuel à ACTIVE (ex: DRAFT -> ACTIVE)
    validateStateTransition(employee.status, EmployeeStatus.ACTIVE);

    employee.status = EmployeeStatus.ACTIVE;
    
    // Si la date d'embauche n'était pas définie, on met aujourd'hui par défaut
    if (!employee.hireDate) {
      employee.hireDate = new Date();
    }

    return this.employeeRepository.save(employee);
  }
}
