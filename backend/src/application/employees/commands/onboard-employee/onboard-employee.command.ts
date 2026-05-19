export class OnboardEmployeeCommand {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
  ) {}
}
