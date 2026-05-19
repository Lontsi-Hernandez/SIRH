import { CreateEmployeeDto } from '../../../../web/dtos/employees/create-employee.dto';

export class CreateEmployeeCommand {
  constructor(
    public readonly dto: CreateEmployeeDto,
    public readonly tenantId: string,
  ) {}
}
