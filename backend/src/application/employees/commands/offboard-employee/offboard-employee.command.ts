export class OffboardEmployeeCommand {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly terminationDate: string,
    public readonly reason: string,
  ) {}
}
