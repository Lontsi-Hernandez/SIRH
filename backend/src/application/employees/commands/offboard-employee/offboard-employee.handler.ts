import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OffboardEmployeeCommand } from './offboard-employee.command';
import { Employee, EmployeeStatus } from '../../../../domain/entities/employee.entity';
import { validateStateTransition } from '../update-employee/update-employee.handler';

@CommandHandler(OffboardEmployeeCommand)
export class OffboardEmployeeHandler implements ICommandHandler<OffboardEmployeeCommand> {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(command: OffboardEmployeeCommand): Promise<Employee> {
    const { id, tenantId, terminationDate, reason } = command;
    const employee = await this.employeeRepository.findOne({ where: { id, tenantId } });

    if (!employee) throw new NotFoundException(`Employé ${id} introuvable`);

    // Valider le passage de l'état actuel à TERMINATED (ex: ACTIVE -> TERMINATED)
    validateStateTransition(employee.status, EmployeeStatus.TERMINATED);

    employee.status = EmployeeStatus.TERMINATED;
    employee.terminationDate = new Date(terminationDate);
    
    // On peut enregistrer la raison du départ dans nos attributs dynamiques pour l'historique !
    if (!employee.customAttributes) {
      employee.customAttributes = {};
    }
    employee.customAttributes.offboardingReason = reason;

    return this.employeeRepository.save(employee);
  }
}
