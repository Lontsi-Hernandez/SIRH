import {
  Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Patch, Delete, Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { UserRole } from '../../domain/entities/employee.entity';
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dtos/tenants/create-tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Obtenir la liste de toutes les entreprises (Platform Admin)' })
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle entreprise et son compte administrateur principal' })
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Activer ou désactiver une entreprise' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.tenantsService.updateStatus(id, isActive);
  }

  @Delete(':id')
  @Roles(UserRole.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer définitivement une entreprise et toutes ses données' })
  async delete(@Param('id') id: string) {
    await this.tenantsService.deletePermanently(id);
  }
}
