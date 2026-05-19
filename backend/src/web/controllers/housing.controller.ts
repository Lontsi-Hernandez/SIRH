import {
  Controller, Get, Post, Put, Delete, Body, Param, Req, Headers,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiHeader } from '@nestjs/swagger';

import { HousingService } from '../services/housing.service';
import { CreateHousingDto } from '../dtos/housing/create-housing.dto';
import { AssignHousingDto } from '../dtos/housing/assign-housing.dto';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { UserRole } from '../../domain/entities/employee.entity';

@ApiTags('Hébergements')
@ApiBearerAuth('JWT')
@ApiHeader({ name: 'X-Tenant-ID', description: 'ID de l\'entreprise (Tenant)', required: false })
@UseGuards(RolesGuard)
@Controller('housings')
export class HousingController {
  constructor(private readonly housingService: HousingService) {}

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
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Obtenir la liste de tous les hébergements' })
  async findAll(@Req() req: any, @Headers('x-tenant-id') tenantIdHeader?: string) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.housingService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtenir les détails d\'un hébergement spécifique' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.housingService.findOne(id, tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouvel hébergement' })
  async create(
    @Body() dto: CreateHousingDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.housingService.create(dto, tenantId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Mettre à jour les informations d\'un hébergement' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateHousingDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.housingService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un hébergement (seulement si vide)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.housingService.remove(id, tenantId);
  }

  // ─── Affectations des employés ─────────────────────────────────────────────

  @Post(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Loger un employé dans cette résidence' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignHousingDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.housingService.assignEmployee(id, dto, tenantId);
  }

  @Post('assignments/:assignmentId/terminate')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Mettre fin à l\'hébergement d\'un employé' })
  async terminate(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() body: { endDate?: string },
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.housingService.terminateAssignment(assignmentId, tenantId, body.endDate);
  }
}
