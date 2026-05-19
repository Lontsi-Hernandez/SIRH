import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Housing, HousingAssignment, HousingAssignmentStatus } from '../../domain/entities/housing.entity';
import { Employee } from '../../domain/entities/employee.entity';
import { CreateHousingDto } from '../dtos/housing/create-housing.dto';
import { AssignHousingDto } from '../dtos/housing/assign-housing.dto';

@Injectable()
export class HousingService {
  private readonly logger = new Logger(HousingService.name);

  constructor(
    @InjectRepository(Housing)
    private readonly housingRepository: Repository<Housing>,
    @InjectRepository(HousingAssignment)
    private readonly assignmentRepository: Repository<HousingAssignment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  // ─── CRUD Hébergements ─────────────────────────────────────────────────────

  async findAll(tenantId: string) {
    const housings = await this.housingRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
      relations: ['assignments', 'assignments.employee'],
    });

    // Calculer l'occupation courante pour chaque hébergement
    return housings.map(h => {
      const activeCount = h.assignments.filter(
        a => a.status === HousingAssignmentStatus.ACTIVE
      ).length;

      return {
        ...h,
        occupiedBeds: activeCount,
        availableBeds: Math.max(0, h.capacity - activeCount),
        occupancyRate: h.capacity > 0 ? Math.round((activeCount / h.capacity) * 100) : 0,
      };
    });
  }

  async findOne(id: string, tenantId: string) {
    const housing = await this.housingRepository.findOne({
      where: { id, tenantId },
      relations: ['assignments', 'assignments.employee'],
    });

    if (!housing) {
      throw new NotFoundException(`Hébergement avec l'ID ${id} non trouvé`);
    }

    const activeAssignments = housing.assignments.filter(
      a => a.status === HousingAssignmentStatus.ACTIVE
    );

    return {
      ...housing,
      occupiedBeds: activeAssignments.length,
      availableBeds: Math.max(0, housing.capacity - activeAssignments.length),
      occupancyRate: housing.capacity > 0 ? Math.round((activeAssignments.length / housing.capacity) * 100) : 0,
      activeAssignments,
    };
  }

  async create(dto: CreateHousingDto, tenantId: string) {
    const housing = this.housingRepository.create({
      ...dto,
      tenantId,
    });
    const saved = await this.housingRepository.save(housing);
    this.logger.log(`🏡 Nouvel hébergement créé : ${saved.name} (${saved.id})`);
    return saved;
  }

  async update(id: string, dto: CreateHousingDto, tenantId: string) {
    const housing = await this.housingRepository.findOne({ where: { id, tenantId } });
    if (!housing) {
      throw new NotFoundException(`Hébergement non trouvé`);
    }

    // Mettre à jour les champs
    Object.assign(housing, dto);
    return this.housingRepository.save(housing);
  }

  async remove(id: string, tenantId: string) {
    const housing = await this.housingRepository.findOne({ where: { id, tenantId } });
    if (!housing) {
      throw new NotFoundException(`Hébergement non trouvé`);
    }

    // Vérifier s'il y a des affectations actives
    const activeCount = await this.assignmentRepository.count({
      where: { housingId: id, status: HousingAssignmentStatus.ACTIVE, tenantId },
    });

    if (activeCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cet hébergement car ${activeCount} employé(s) y sont actuellement logés.`
      );
    }

    await this.housingRepository.remove(housing);
    this.logger.log(`🗑️ Hébergement supprimé : ${housing.name} (${id})`);
    return { success: true };
  }

  // ─── Affectations des employés ─────────────────────────────────────────────

  async assignEmployee(housingId: string, dto: AssignHousingDto, tenantId: string) {
    const { employeeId, startDate, endDate, rentDeductionAmount } = dto;

    // 1. Vérifier si l'hébergement existe
    const housing = await this.housingRepository.findOne({
      where: { id: housingId, tenantId },
      relations: ['assignments'],
    });

    if (!housing) {
      throw new NotFoundException(`Hébergement non trouvé`);
    }

    // 2. Vérifier la capacité disponible
    const activeAssignments = housing.assignments.filter(
      a => a.status === HousingAssignmentStatus.ACTIVE
    );
    if (activeAssignments.length >= housing.capacity) {
      throw new BadRequestException(`Cet hébergement est déjà complet (Capacité: ${housing.capacity} lits)`);
    }

    // 3. Vérifier si l'employé existe et appartient au bon tenant
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException(`Employé non trouvé`);
    }

    // 4. Vérifier si l'employé a déjà un logement actif
    const currentAssignment = await this.assignmentRepository.findOne({
      where: { employeeId, status: HousingAssignmentStatus.ACTIVE, tenantId },
    });
    if (currentAssignment) {
      throw new BadRequestException(
        `Cet employé est déjà logé dans une autre résidence (ID: ${currentAssignment.housingId}). Mettez d'abord fin à son affectation actuelle.`
      );
    }

    // 5. Créer l'affectation
    const assignment = this.assignmentRepository.create({
      employeeId,
      housingId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      rentDeductionAmount,
      status: HousingAssignmentStatus.ACTIVE,
      tenantId,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);
    this.logger.log(`🔑 Employé ${employee.firstName} ${employee.lastName} affecté à la résidence ${housing.name}`);

    return this.assignmentRepository.findOne({
      where: { id: savedAssignment.id },
      relations: ['employee', 'housing'],
    });
  }

  async terminateAssignment(assignmentId: string, tenantId: string, customEndDate?: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId, tenantId },
      relations: ['employee', 'housing'],
    });

    if (!assignment) {
      throw new NotFoundException(`Affectation non trouvée`);
    }

    if (assignment.status !== HousingAssignmentStatus.ACTIVE) {
      throw new BadRequestException(`Cette affectation n'est plus active (Statut: ${assignment.status})`);
    }

    // Terminer l'affectation
    assignment.status = HousingAssignmentStatus.COMPLETED;
    assignment.endDate = customEndDate ? new Date(customEndDate) : new Date();

    await this.assignmentRepository.save(assignment);
    this.logger.log(
      `🚪 Affectation terminée pour ${assignment.employee.firstName} ${assignment.employee.lastName} de la résidence ${assignment.housing.name}`
    );

    return assignment;
  }
}
