import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Req, Headers,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, ForbiddenException, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { UserRole } from '../../domain/entities/employee.entity';
import { DepartmentsService, CreateDepartmentDto, UpdateDepartmentDto } from '../services/departments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../domain/entities/employee.entity';

@ApiTags('Departments')
@ApiBearerAuth('JWT')
@ApiHeader({ name: 'X-Tenant-ID', description: 'ID de l\'entreprise (Tenant)', required: false })
@UseGuards(RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly service: DepartmentsService,
    @InjectRepository(Employee)
    private readonly empRepo: Repository<Employee>,
  ) {}

  private resolveTenantId(req: any, header?: string): string {
    return header || req['tenantId'] || req.headers['x-tenant-id'] || req['tenant']?.id || 'default';
  }

  /** Résout l'entité Employee de l'utilisateur connecté */
  private async resolveEmployee(req: any, tenantId: string): Promise<Employee | null> {
    const email = req.user?.email || req.user?.sub;
    if (!email) return null;
    return this.empRepo.findOne({ where: { email, tenantId } });
  }

  // ── GET tous les départements ───────────────────────────────────────────
  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Liste tous les départements du tenant' })
  async findAll(
    @Req() req: any,
    @Headers('x-tenant-id') h?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantId = this.resolveTenantId(req, h);
    let filterBranchId = branchId;

    if (req.user?.role === UserRole.MANAGER) {
      const emp = await this.resolveEmployee(req, tenantId);
      if (emp?.branchId) filterBranchId = emp.branchId;
    }

    return this.service.findAll(tenantId, filterBranchId);
  }

  // ── GET un département ─────────────────────────────────────────────────
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtenir un département par ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any, @Headers('x-tenant-id') h?: string) {
    return this.service.findOne(id, this.resolveTenantId(req, h));
  }

  // ── GET employés du département ─────────────────────────────────────────
  @Get(':id/employees')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Employés rattachés à un département' })
  getEmployees(@Param('id', ParseUUIDPipe) id: string, @Req() req: any, @Headers('x-tenant-id') h?: string) {
    return this.service.getEmployees(id, this.resolveTenantId(req, h));
  }

  // ── POST créer département (SUPER_ADMIN uniquement) ───────────────────────
  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau département (SUPER_ADMIN uniquement)' })
  create(@Body() dto: CreateDepartmentDto, @Req() req: any, @Headers('x-tenant-id') h?: string) {
    return this.service.create(dto, this.resolveTenantId(req, h));
  }

  // ── PUT modifier département (SUPER_ADMIN uniquement) ─────────────────────
  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier un département (SUPER_ADMIN uniquement)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
    @Req() req: any,
    @Headers('x-tenant-id') h?: string,
  ) {
    return this.service.update(id, dto, this.resolveTenantId(req, h));
  }

  // ── PATCH assigner le gérant principal (SUPER_ADMIN uniquement) ──────────
  @Patch(':id/manager')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assigner un gérant à un département (SUPER_ADMIN uniquement)' })
  assignManager(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { managerId: string | null },
    @Req() req: any,
    @Headers('x-tenant-id') h?: string,
  ) {
    return this.service.assignManager(id, body.managerId, this.resolveTenantId(req, h));
  }

  // ── POST ajouter un assistant-gérant (gérant du dept OU ADMIN/HR) ──────
  @Post(':id/assistants')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajouter un assistant-gérant (max 2, réservé au gérant du département ou ADMIN/HR)' })
  async addAssistant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { assistantId: string },
    @Req() req: any,
    @Headers('x-tenant-id') h?: string,
  ) {
    const tenantId = this.resolveTenantId(req, h);
    const emp = await this.resolveEmployee(req, tenantId);
    if (!emp) throw new ForbiddenException('Employé non trouvé.');
    return this.service.addAssistantManager(id, body.assistantId, emp, tenantId);
  }

  // ── DELETE retirer un assistant-gérant (gérant du dept OU ADMIN/HR) ────
  @Delete(':id/assistants/:assistantId')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer un assistant-gérant' })
  async removeAssistant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
    @Req() req: any,
    @Headers('x-tenant-id') h?: string,
  ) {
    const tenantId = this.resolveTenantId(req, h);
    const emp = await this.resolveEmployee(req, tenantId);
    if (!emp) throw new ForbiddenException('Employé non trouvé.');
    return this.service.removeAssistantManager(id, assistantId, emp, tenantId);
  }

  // ── DELETE supprimer département (ADMIN uniquement) ───────────────────
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un département (ADMIN uniquement)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any, @Headers('x-tenant-id') h?: string) {
    return this.service.remove(id, this.resolveTenantId(req, h));
  }
}
