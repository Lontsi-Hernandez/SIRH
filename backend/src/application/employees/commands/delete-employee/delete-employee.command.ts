export class DeleteEmployeeCommand {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
  ) {}
}
