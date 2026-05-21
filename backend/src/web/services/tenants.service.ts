import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../domain/entities/tenant.entity';
import { Employee, EmployeeStatus, UserRole } from '../../domain/entities/employee.entity';
import { User } from '../../domain/entities/user.entity';
import { Branch } from '../../domain/entities/branch.entity';
import { CreateTenantDto } from '../dtos/tenants/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find({ order: { name: 'ASC' } });
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    // 1. Vérifier si le slug existe déjà
    const existingTenant = await this.tenantRepo.findOne({ where: { slug: dto.slug } });
    if (existingTenant) {
      throw new ConflictException(`Le code entreprise (slug) "${dto.slug}" existe déjà.`);
    }

    // 2. Vérifier si l'adresse email de l'administrateur existe déjà dans la plateforme
    const existingEmployee = await this.employeeRepo.findOne({ where: { email: dto.adminEmail.toLowerCase().trim() } });
    if (existingEmployee) {
      throw new ConflictException(`L'adresse email "${dto.adminEmail}" est déjà utilisée.`);
    }

    // 3. Créer le Tenant
    const tenant = this.tenantRepo.create({
      name: dto.name,
      slug: dto.slug,
      industry: dto.industry || 'Autre',
      website: dto.website,
      contactEmail: dto.contactEmail.toLowerCase().trim(),
      province: dto.province || 'QC',
      maxEmployees: dto.maxEmployees || 50,
      isActive: true,
      subscriptionPlan: 'enterprise',
    });
    const savedTenant = await this.tenantRepo.save(tenant);

    // 4. Créer une succursale par défaut pour ce tenant
    const branch = this.branchRepo.create({
      name: `Siège Social - ${dto.name}`,
      code: 'HQ',
      address: `Adresse principale de ${dto.name}`,
      tenantId: savedTenant.id,
    });
    const savedBranch = await this.branchRepo.save(branch);

    // 5. Créer l'employé SUPER_ADMIN (CEO) pour ce tenant
    const employee = this.employeeRepo.create({
      employeeNumber: 'EMP-0001',
      firstName: dto.adminFirstName,
      lastName: dto.adminLastName,
      email: dto.adminEmail.toLowerCase().trim(),
      status: EmployeeStatus.ACTIVE,
      role: UserRole.SUPER_ADMIN,
      hireDate: new Date(),
      branchId: savedBranch.id,
      tenantId: savedTenant.id,
    });
    const savedEmployee = await this.employeeRepo.save(employee);

    // 6. Créer le compte utilisateur lié dans la table `users`
    const user = this.userRepo.create({
      email: savedEmployee.email.toLowerCase().trim(),
      isActive: true,
      employeeId: savedEmployee.id,
      tenantId: savedTenant.id,
    });
    await this.userRepo.save(user);

    // 7. Lier la succursale au manager (CEO) par défaut
    savedBranch.managerId = savedEmployee.id;
    await this.branchRepo.save(savedBranch);

    return savedTenant;
  }

  async updateStatus(id: string, isActive: boolean): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Entreprise introuvable.`);
    }

    if (tenant.slug === 'system-admin') {
      throw new BadRequestException("Impossible de désactiver le tenant système principal.");
    }

    tenant.isActive = isActive;
    return this.tenantRepo.save(tenant);
  }

  async deletePermanently(id: string): Promise<void> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Entreprise introuvable.`);
    }

    if (tenant.slug === 'system-admin') {
      throw new BadRequestException("Impossible de supprimer le tenant système principal.");
    }

    const entityManager = this.tenantRepo.manager;
    await entityManager.transaction(async (trx) => {
      // Helper résilient pour supprimer de manière sécurisée si la table existe
      const deleteIfExists = async (tableName: string) => {
        const tableCheck = await trx.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [tableName]);

        if (tableCheck[0]?.exists) {
          await trx.query(`DELETE FROM "${tableName}" WHERE "tenant_id" = $1`, [id]);
        }
      };

      // Helper pour faire des updates si la table existe
      const updateIfExists = async (tableName: string, queryStr: string) => {
        const tableCheck = await trx.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [tableName]);

        if (tableCheck[0]?.exists) {
          await trx.query(queryStr, [id]);
        }
      };

      // 1. Supprimer les tables transactionnelles et secondaires
      await deleteIfExists('time_entries');
      await deleteIfExists('messages');
      await deleteIfExists('announcements');
      await deleteIfExists('users');
      await deleteIfExists('shifts');
      await deleteIfExists('payrolls');
      await deleteIfExists('notifications');
      await deleteIfExists('leaves');
      await deleteIfExists('job_applications');
      await deleteIfExists('job_postings');
      await deleteIfExists('trainings');
      await deleteIfExists('reviews');
      await deleteIfExists('goals');
      await deleteIfExists('housing_assignments');
      await deleteIfExists('housings');

      // 2. Dissocier les relations cycliques entre les succursales et les employés
      await updateIfExists('branches', 'UPDATE "branches" SET "manager_id" = NULL WHERE "tenant_id" = $1');
      await updateIfExists('employees', 'UPDATE "employees" SET "manager_id" = NULL WHERE "tenant_id" = $1');

      // 3. Supprimer les départements, les employés puis les succursales
      await deleteIfExists('departments');
      await deleteIfExists('employees');
      await deleteIfExists('branches');

      // 4. Supprimer le locataire (tenant) final
      await trx.query('DELETE FROM "tenants" WHERE "id" = $1', [id]);
    });
  }
}
