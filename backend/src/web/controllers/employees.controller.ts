import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { RolesGuard, Roles } from '../guards/roles.guard';
import { UserRole } from '../../domain/entities/employee.entity';

// Commands
import { CreateEmployeeCommand } from '../../application/employees/commands/create-employee/create-employee.command';
import { UpdateEmployeeCommand } from '../../application/employees/commands/update-employee/update-employee.command';
import { DeleteEmployeeCommand } from '../../application/employees/commands/delete-employee/delete-employee.command';

// Queries
import { GetAllEmployeesQuery } from '../../application/employees/queries/get-all-employees/get-all-employees.query';
import { GetEmployeeByIdQuery } from '../../application/employees/queries/get-employee-by-id/get-employee-by-id.query';

// DTOs
import { CreateEmployeeDto } from '../dtos/employees/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/employees/update-employee.dto';
import { EmployeeFilterDto } from '../dtos/employees/employee-filter.dto';

@ApiTags('Employees')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtenir la liste des employés' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query() filters: EmployeeFilterDto, @Param() req: any) {
    return this.queryBus.execute(
      new GetAllEmployeesQuery(req['tenantId'], filters),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un employé par ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Param() req: any,
  ) {
    return this.queryBus.execute(new GetEmployeeByIdQuery(id, req['tenantId']));
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Créer un nouvel employé' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEmployeeDto, @Param() req: any) {
    return this.commandBus.execute(new CreateEmployeeCommand(dto, req['tenantId']));
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Mettre à jour un employé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @Param() req: any,
  ) {
    return this.commandBus.execute(new UpdateEmployeeCommand(id, dto, req['tenantId']));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Désactiver un employé (soft delete)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param() req: any,
  ) {
    return this.commandBus.execute(new DeleteEmployeeCommand(id, req['tenantId']));
  }

  @Patch(':id/onboard')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Onboarding — Activer et configurer un nouvel employé' })
  async onboard(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Implémenter l'onboarding
    return { message: 'Onboarding initié', employeeId: id };
  }

  @Patch(':id/offboard')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Offboarding — Procédure de départ d\'un employé' })
  async offboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { terminationDate: string; reason: string },
  ) {
    // TODO: Implémenter l'offboarding
    return { message: 'Offboarding initié', employeeId: id };
  }

  @Get(':id/org-chart')
  @ApiOperation({ summary: 'Obtenir l\'organigramme à partir d\'un employé' })
  async getOrgChart(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Retourner la hiérarchie
    return { employeeId: id, subordinates: [] };
  }
}
