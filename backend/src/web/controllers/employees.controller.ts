import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, Req, Headers,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';

import { RolesGuard, Roles } from '../guards/roles.guard';
import { UserRole } from '../../domain/entities/employee.entity';

// Commands
import { CreateEmployeeCommand } from '../../application/employees/commands/create-employee/create-employee.command';
import { UpdateEmployeeCommand } from '../../application/employees/commands/update-employee/update-employee.command';
import { DeleteEmployeeCommand } from '../../application/employees/commands/delete-employee/delete-employee.command';
import { OnboardEmployeeCommand } from '../../application/employees/commands/onboard-employee/onboard-employee.command';
import { OffboardEmployeeCommand } from '../../application/employees/commands/offboard-employee/offboard-employee.command';

// Queries
import { GetAllEmployeesQuery } from '../../application/employees/queries/get-all-employees/get-all-employees.query';
import { GetEmployeeByIdQuery } from '../../application/employees/queries/get-employee-by-id/get-employee-by-id.query';

// DTOs
import { CreateEmployeeDto } from '../dtos/employees/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/employees/update-employee.dto';
import { EmployeeFilterDto } from '../dtos/employees/employee-filter.dto';

@ApiTags('Employees')
@ApiBearerAuth('JWT')
@ApiHeader({ name: 'X-Tenant-ID', description: 'ID de l\'entreprise (Tenant)', required: false })
@UseGuards(RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Résout le tenantId de manière extrêmement résiliente
  private resolveTenantId(req: any, tenantIdHeader?: string): string {
    return (
      tenantIdHeader ||
      req['tenantId'] ||
      req.headers['x-tenant-id'] ||
      (req['tenant']?.id) ||
      'default'
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtenir la liste des employés' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query() filters: EmployeeFilterDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.queryBus.execute(
      new GetAllEmployeesQuery(tenantId, filters),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un employé par ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.queryBus.execute(new GetEmployeeByIdQuery(id, tenantId));
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Créer un nouvel employé' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateEmployeeDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.commandBus.execute(new CreateEmployeeCommand(dto, tenantId));
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Mettre à jour un employé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.commandBus.execute(new UpdateEmployeeCommand(id, dto, tenantId));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Désactiver un employé (soft delete)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.commandBus.execute(new DeleteEmployeeCommand(id, tenantId));
  }

  @Patch(':id/onboard')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Onboarding — Activer et configurer un nouvel employé' })
  async onboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.commandBus.execute(new OnboardEmployeeCommand(id, tenantId));
  }

  @Patch(':id/offboard')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Offboarding — Procédure de départ d\'un employé' })
  async offboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { terminationDate: string; reason: string },
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.commandBus.execute(
      new OffboardEmployeeCommand(id, tenantId, body.terminationDate, body.reason),
    );
  }

  @Get(':id/org-chart')
  @ApiOperation({ summary: 'Obtenir l\'organigramme à partir d\'un employé' })
  async getOrgChart(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Retourner la hiérarchie
    return { employeeId: id, subordinates: [] };
  }
}


