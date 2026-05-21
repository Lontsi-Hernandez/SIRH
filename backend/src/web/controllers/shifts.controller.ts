import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, Req, Headers, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { UserRole } from '../../domain/entities/employee.entity';
import { ShiftsService } from '../services/shifts.service';
import { CreateShiftDto } from '../dtos/shifts/create-shift.dto';
import { UpdateShiftDto } from '../dtos/shifts/update-shift.dto';
import { ClockInDto } from '../dtos/shifts/clock-in.dto';
import { ClockOutDto } from '../dtos/shifts/clock-out.dto';

@ApiTags('Shifts')
@ApiBearerAuth('JWT')
@ApiHeader({ name: 'X-Tenant-ID', description: 'ID de l\'entreprise (Tenant)', required: false })
@UseGuards(RolesGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

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
  @ApiOperation({ summary: 'Obtenir la liste des plannings d\'horaires' })
  async findAll(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('employeeId') employeeId: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    
    let targetEmployeeId = employeeId;
    let excludeDrafts = false;
    
    // Si l'utilisateur est un simple EMPLOYEE, il ne peut voir que ses propres horaires
    if (req.user?.role === UserRole.EMPLOYEE) {
      const employee = await this.shiftsService.getEmployeeByEmail(req.user.email, tenantId);
      targetEmployeeId = employee.id;
      excludeDrafts = true;
    }
    
    return this.shiftsService.findAll(startDate, endDate, targetEmployeeId, tenantId, excludeDrafts);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Planifier un nouveau quart de travail' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateShiftDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.shiftsService.create(dto, tenantId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour ou réassigner un quart de travail' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.shiftsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Supprimer un quart de travail planifié' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    await this.shiftsService.remove(id, tenantId);
  }

  @Post('publish')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Publier les quarts de travail en brouillon pour une période donnée' })
  async publish(
    @Body() body: { startDate: string; endDate: string },
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.shiftsService.publish(body.startDate, body.endDate, tenantId);
  }

  @Get('qr-code')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Générer un token de QR Code dynamique pour pointage' })
  async getQrCode(
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    return this.shiftsService.generateQrCodeToken(tenantId);
  }

  @Post('clock-in')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Pointage d\'ARRIVÉE (Clock In)' })
  @HttpCode(HttpStatus.CREATED)
  async clockIn(
    @Body() dto: ClockInDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    const employee = await this.shiftsService.getEmployeeByEmail(req.user.email, tenantId);
    return this.shiftsService.clockIn(employee.id, dto, tenantId);
  }

  @Post('clock-out')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Pointage de DÉPART (Clock Out)' })
  async clockOut(
    @Body() dto: ClockOutDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    const employee = await this.shiftsService.getEmployeeByEmail(req.user.email, tenantId);
    return this.shiftsService.clockOut(employee.id, dto, tenantId);
  }

  @Post(':id/start-break')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Débuter la pause d\'un employé' })
  async startBreak(
    @Param('id') id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    const employee = await this.shiftsService.getEmployeeByEmail(req.user.email, tenantId);
    return this.shiftsService.startBreak(employee.id, id, tenantId);
  }

  @Post(':id/end-break')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Terminer la pause d\'un employé' })
  async endBreak(
    @Param('id') id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(req, tenantIdHeader);
    const employee = await this.shiftsService.getEmployeeByEmail(req.user.email, tenantId);
    return this.shiftsService.endBreak(employee.id, id, tenantId);
  }
}
