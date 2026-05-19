export class GetEmployeeByIdQuery {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
  ) {}
}
