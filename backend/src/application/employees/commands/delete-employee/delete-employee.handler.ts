import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DeleteEmployeeCommand } from './delete-employee.command';
import { Employee, EmployeeStatus } from '../../../../domain/entities/employee.entity';

@CommandHandler(DeleteEmployeeCommand)
export class DeleteEmployeeHandler implements ICommandHandler<DeleteEmployeeCommand> {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(command: DeleteEmployeeCommand): Promise<void> {
    const { id, tenantId } = command;
    const employee = await this.employeeRepository.findOne({ where: { id, tenantId } });

    if (!employee) throw new NotFoundException(`Employé ${id} introuvable`);

    // Soft delete — changer le statut
    employee.status = EmployeeStatus.TERMINATED;
    employee.terminationDate = new Date();
    await this.employeeRepository.save(employee);
  }
}
