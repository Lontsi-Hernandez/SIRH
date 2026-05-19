import { UpdateEmployeeDto } from '../../../../web/dtos/employees/create-employee.dto';

export class UpdateEmployeeCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateEmployeeDto,
    public readonly tenantId: string,
  ) {}
}
