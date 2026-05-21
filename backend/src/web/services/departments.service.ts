import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../domain/entities/department.entity';
import { Employee, UserRole } from '../../domain/entities/employee.entity';

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  code?: string;
  managerId?: string;
  parentDepartmentId?: string;
  branchId?: string;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {}

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(Employee)
    private readonly empRepo: Repository<Employee>,
  ) {}

  async findAll(tenantId: string, branchId?: string): Promise<Department[]> {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;

    return this.deptRepo.find({
      where,
      relations: ['manager', 'subDepartments'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Department> {
    const dept = await this.deptRepo.findOne({
      where: { id, tenantId },
      relations: ['manager', 'subDepartments', 'parentDepartment'],
    });
    if (!dept) throw new NotFoundException(`Département introuvable`);
    return dept;
  }

  /** Trouver le département géré par un manager donné */
  async findByManager(managerId: string, tenantId: string): Promise<Department | null> {
    return this.deptRepo.findOne({
      where: { managerId, tenantId },
      relations: ['manager'],
    });
  }

  async create(dto: CreateDepartmentDto, tenantId: string): Promise<Department> {
    const dept = this.deptRepo.create({
      ...dto,
      tenantId,
      assistantManagerIds: [],
    });
    return this.deptRepo.save(dept);
  }

  async update(id: string, dto: UpdateDepartmentDto, tenantId: string): Promise<Department> {
    const dept = await this.findOne(id, tenantId);
    Object.assign(dept, dto);
    return this.deptRepo.save(dept);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const dept = await this.findOne(id, tenantId);
    await this.empRepo.createQueryBuilder()
      .update(Employee)
      .set({ departmentId: () => 'NULL' })
      .where('department_id = :id AND tenant_id = :tenantId', { id, tenantId })
      .execute();
    await this.deptRepo.remove(dept);
  }

  async getEmployees(departmentId: string, tenantId: string): Promise<Employee[]> {
    return this.empRepo.find({
      where: { departmentId, tenantId },
      relations: ['position'],
      order: { lastName: 'ASC' },
    });
  }

  async assignManager(deptId: string, managerId: string | null, tenantId: string): Promise<Department> {
    const dept = await this.findOne(deptId, tenantId);
    dept.managerId = managerId ?? undefined;
    return this.deptRepo.save(dept);
  }

  /**
   * Ajouter un assistant-gérant (max 2) à un département.
   * Seul le gérant principal du département peut effectuer cette action.
   */
  async addAssistantManager(
    deptId: string,
    assistantId: string,
    requestingEmployee: Employee,
    tenantId: string,
  ): Promise<Department> {
    const dept = await this.findOne(deptId, tenantId);

    // Vérification : seul le gérant principal (ou ADMIN/HR) peut ajouter des assistants
    const isOwner = dept.managerId === requestingEmployee.id;
    const isAdminOrHR = [UserRole.ADMIN, UserRole.HR].includes(requestingEmployee.role);
    if (!isOwner && !isAdminOrHR) {
      throw new ForbiddenException('Seul le gérant de ce département peut ajouter des assistants.');
    }

    const current = dept.assistantManagerIds ?? [];

    // Limite de 2 assistants
    if (current.length >= 2 && !current.includes(assistantId)) {
      throw new BadRequestException('Un département ne peut avoir que 2 assistants-gérants au maximum.');
    }

    // Pas de doublons
    if (!current.includes(assistantId)) {
      dept.assistantManagerIds = [...current, assistantId];
      await this.deptRepo.save(dept);
    }

    return this.findOne(deptId, tenantId);
  }

  /**
   * Retirer un assistant-gérant d'un département.
   */
  async removeAssistantManager(
    deptId: string,
    assistantId: string,
    requestingEmployee: Employee,
    tenantId: string,
  ): Promise<Department> {
    const dept = await this.findOne(deptId, tenantId);

    const isOwner = dept.managerId === requestingEmployee.id;
    const isAdminOrHR = [UserRole.ADMIN, UserRole.HR].includes(requestingEmployee.role);
    if (!isOwner && !isAdminOrHR) {
      throw new ForbiddenException('Seul le gérant de ce département peut retirer des assistants.');
    }

    dept.assistantManagerIds = (dept.assistantManagerIds ?? []).filter(id => id !== assistantId);
    return this.deptRepo.save(dept);
  }
}
