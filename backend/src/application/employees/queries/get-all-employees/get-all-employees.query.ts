import { EmployeeFilterDto } from '../../../../web/dtos/employees/create-employee.dto';

export class GetAllEmployeesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filters: EmployeeFilterDto,
  ) {}
}
