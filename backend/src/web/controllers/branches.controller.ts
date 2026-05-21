import {
  Controller, Get, Post, Put, Delete, Body, Param, Req, Headers,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { UserRole } from '../../domain/entities/employee.entity';
import { BranchesService, CreateBranchDto, UpdateBranchDto } from '../services/branches.service';

@ApiTags('Branches')
@ApiBearerAuth('JWT')
@ApiHeader({ name: 'X-Tenant-ID', description: 'ID de l\'entreprise (Tenant)', required: false })
@UseGuards(RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  private resolveTenantId(req: any, header?: string): string {
    return header || req['tenantId'] || req.headers['x-tenant-id'] || req['tenant']?.id || 'default';
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Liste toutes les succursales du tenant' })
  findAll(@Req() req: any, @Headers('x-tenant-id') h?: string) {
    return this.service.findAll(this.resolveTenantId(req, h));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtenir une succursale par ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any, @Headers('x-tenant-id') h?: string) {
    return this.service.findOne(id, this.resolveTenantId(req, h));
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une succursale' })
  create(@Body() dto: CreateBranchDto, @Req() req: any, @Headers('x-tenant-id') h?: string) {
    return this.service.create(dto, this.resolveTenantId(req, h));
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier une succursale' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @Req() req: any,
    @Headers('x-tenant-id') h?: string,
  ) {
    return this.service.update(id, dto, this.resolveTenantId(req, h));
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une succursale' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any, @Headers('x-tenant-id') h?: string) {
    return this.service.remove(id, this.resolveTenantId(req, h));
  }
}
