import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between, Not } from 'typeorm';
import { Shift, ShiftStatus } from '../../domain/entities/shift.entity';
import { TimeEntry } from '../../domain/entities/user.entity';
import { Employee } from '../../domain/entities/employee.entity';
import { CreateShiftDto } from '../dtos/shifts/create-shift.dto';
import { UpdateShiftDto } from '../dtos/shifts/update-shift.dto';
import { ClockInDto } from '../dtos/shifts/clock-in.dto';
import { ClockOutDto } from '../dtos/shifts/clock-out.dto';

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {
    // S'assurer que le type ENUM PostgreSQL local ou de production comprend le statut 'DRAFT'
    this.shiftRepository.query(`ALTER TYPE "public"."shifts_status_enum" ADD VALUE IF NOT EXISTS 'DRAFT'`)
      .catch(err => {
        this.logger.debug(`Vérification/Mise à jour de shifts_status_enum : ${err.message}`);
      });
  }

  async getEmployeeByEmail(email: string, tenantId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { email, tenantId } });
    if (!employee) {
      throw new NotFoundException(`Employé avec l'email ${email} introuvable dans cette entreprise`);
    }
    return employee;
  }

  // ── Planification des Horaires ─────────────────────────────────────────────

  async findAll(
    startDate: string,
    endDate: string,
    employeeId: string | null,
    tenantId: string,
    excludeDrafts = false,
  ): Promise<Shift[]> {
    const whereClause: any = {
      tenantId,
      startTime: Between(new Date(startDate), new Date(endDate)),
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (excludeDrafts) {
      whereClause.status = Not(ShiftStatus.DRAFT);
    }

    return this.shiftRepository.find({
      where: whereClause,
      relations: ['employee'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { id, tenantId },
      relations: ['employee'],
    });

    if (!shift) {
      throw new NotFoundException(`Quart de travail avec l'ID ${id} non trouvé`);
    }

    return shift;
  }

  async create(dto: CreateShiftDto, tenantId: string): Promise<Shift> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin.');
    }

    // Vérifier si l'employé existe dans le tenant
    const employee = await this.employeeRepository.findOne({ where: { id: dto.employeeId, tenantId } });
    if (!employee) {
      throw new NotFoundException(`Employé avec l'ID ${dto.employeeId} introuvable dans cette entreprise`);
    }

    // Vérifier les chevauchements de plannings
    const overlapping = await this.shiftRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        tenantId,
        startTime: LessThan(end),
        endTime: MoreThan(start),
      },
    });

    if (overlapping) {
      throw new ConflictException(
        `Cet employé est déjà planifié sur un autre quart de travail chevauchant cette période (${overlapping.startTime.toLocaleTimeString()} - ${overlapping.endTime.toLocaleTimeString()})`
      );
    }

    const shift = this.shiftRepository.create({
      ...dto,
      startTime: start,
      endTime: end,
      tenantId,
      status: ShiftStatus.DRAFT, // Nouveau shift créé par défaut en DRAFT
    });

    const saved = await this.shiftRepository.save(shift);
    this.logger.log(`🗓️ Nouveau quart planifié en BROUILLON : Employé ${dto.employeeId} (${dto.startTime} - ${dto.endTime})`);
    return saved;
  }

  async update(id: string, dto: UpdateShiftDto, tenantId: string): Promise<Shift> {
    const shift = await this.findOne(id, tenantId);

    const start = dto.startTime ? new Date(dto.startTime) : shift.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : shift.endTime;

    if (start >= end) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin.');
    }

    // Si on réassigne l'employé
    if (dto.employeeId && dto.employeeId !== shift.employeeId) {
      const employee = await this.employeeRepository.findOne({ where: { id: dto.employeeId, tenantId } });
      if (!employee) {
        throw new NotFoundException(`Employé avec l'ID ${dto.employeeId} introuvable dans cette entreprise`);
      }
    }

    // Vérifier les chevauchements
    const overlapping = await this.shiftRepository.findOne({
      where: {
        employeeId: dto.employeeId || shift.employeeId,
        tenantId,
        id: LessThan(id), // Exclure le shift actuel de la recherche
        startTime: LessThan(end),
        endTime: MoreThan(start),
      },
    });

    if (overlapping && overlapping.id !== id) {
      throw new ConflictException(`Conflit d'horaire détecté pour cet employé.`);
    }

    Object.assign(shift, {
      ...dto,
      startTime: start,
      endTime: end,
    });

    return this.shiftRepository.save(shift);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const shift = await this.findOne(id, tenantId);
    await this.shiftRepository.remove(shift);
    this.logger.log(`🗑️ Quart de travail supprimé : ID ${id}`);
  }

  // ── Pointage et Enregistrement du Temps ─────────────────────────────────────

  private getQrSecret(): string {
    return process.env.JWT_SECRET || 'sirh-qr-secret-key-2026';
  }

  async generateQrCodeToken(tenantId: string): Promise<{ qrCodeToken: string; expiresAt: Date }> {
    const timestamp = Date.now();
    const secret = this.getQrSecret();
    const data = `${tenantId}:${timestamp}`;
    const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    const qrCodeToken = `${tenantId}:${timestamp}:${signature}`;
    const expiresAt = new Date(timestamp + 5 * 60 * 1000); // 5 minutes validity
    return { qrCodeToken, expiresAt };
  }

  async verifyQrCodeToken(token: string, tenantId: string): Promise<boolean> {
    if (!token) {
      throw new BadRequestException('Un scan de QR Code est requis pour pointer.');
    }
    
    const parts = token.split(':');
    if (parts.length !== 3) {
      throw new BadRequestException('QR Code invalide ou illisible.');
    }

    const [tokenTenantId, tokenTimestampStr, signature] = parts;

    // Check tenant match
    if (tokenTenantId !== tenantId) {
      throw new BadRequestException('Ce QR Code appartient à une autre entreprise.');
    }

    // Check expiration
    const tokenTimestamp = parseInt(tokenTimestampStr, 10);
    const now = Date.now();
    if (isNaN(tokenTimestamp) || Math.abs(now - tokenTimestamp) > 5 * 60 * 1000) {
      throw new BadRequestException('Le QR Code a expiré, veuillez scanner le QR actuel affiché sur l\'écran.');
    }

    // Check signature
    const secret = this.getQrSecret();
    const data = `${tokenTenantId}:${tokenTimestampStr}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');

    if (signature !== expectedSignature) {
      throw new BadRequestException('Validation du QR Code échouée. Signature corrompue.');
    }

    return true;
  }

  async clockIn(employeeId: string, dto: ClockInDto, tenantId: string): Promise<TimeEntry> {
    // 1. Validation obligatoire du QR Code
    await this.verifyQrCodeToken(dto.qrCodeToken, tenantId);

    const shift = await this.findOne(dto.shiftId, tenantId);

    if (shift.employeeId !== employeeId) {
      throw new BadRequestException('Vous ne pouvez pas pointer pour le quart d\'un autre collaborateur.');
    }

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(`Ce quart ne peut pas être pointé car son statut est : ${shift.status}`);
    }

    const now = new Date();

    // Création de la feuille de temps réelle
    const timeEntry = this.timeEntryRepository.create({
      clockIn: now,
      clockInLat: dto.latitude,
      clockInLng: dto.longitude,
      clockInMethod: 'qr_code',
      employeeId,
      tenantId,
      notes: shift.notes,
    });

    const savedEntry = await this.timeEntryRepository.save(timeEntry);

    // Mettre à jour le statut du shift en cours
    shift.status = ShiftStatus.IN_PROGRESS;
    shift.actualStartTime = now;
    await this.shiftRepository.save(shift);

    this.logger.log(`📥 Pointage ARRIVÉE réussi via QR Code pour l'employé ${employeeId} à ${now.toLocaleTimeString()}`);
    return savedEntry;
  }

  async clockOut(employeeId: string, dto: ClockOutDto, tenantId: string): Promise<TimeEntry> {
    // 1. Validation obligatoire du QR Code
    await this.verifyQrCodeToken(dto.qrCodeToken, tenantId);

    const shift = await this.findOne(dto.shiftId, tenantId);

    if (shift.employeeId !== employeeId) {
      throw new BadRequestException('Action interdite pour ce collaborateur.');
    }

    if (shift.status !== ShiftStatus.IN_PROGRESS) {
      throw new BadRequestException('Ce quart de travail n\'est pas actif ou a déjà été complété.');
    }

    // Trouver l'entrée de pointage correspondante active
    const timeEntry = await this.timeEntryRepository.findOne({
      where: {
        employeeId,
        tenantId,
        clockOut: null as any,
      },
      order: { clockIn: 'DESC' },
    });

    if (!timeEntry) {
      throw new NotFoundException('Aucune session de pointage active trouvée pour ce quart.');
    }

    const now = new Date();
    timeEntry.clockOut = now;

    // Si l'employé était en pause et a oublié de la fermer avant de pointer la sortie
    if (shift.breakStartTime && !shift.breakEndTime) {
      shift.breakEndTime = now;
    }

    // Calculer les heures travaillées réelles
    const durationMs = now.getTime() - timeEntry.clockIn.getTime();
    let hours = durationMs / (1000 * 60 * 60);

    // Règle personnalisée de la pause :
    // - Si une pause a été prise :
    //   - Si la durée réelle dépasse la durée autorisée, on soustrait uniquement le dépassement.
    //   - Si elle ne dépasse pas, on ne soustrait rien du tout (le temps de pause reste payé / inchangé).
    // - Si aucune pause n'a été prise, on ne soustrait rien.
    if (shift.breakStartTime && shift.breakEndTime) {
      const actualBreakMs = shift.breakEndTime.getTime() - shift.breakStartTime.getTime();
      const allowedBreakMs = shift.breakDurationMinutes * 60 * 1000;

      if (actualBreakMs > allowedBreakMs) {
        const excessMs = actualBreakMs - allowedBreakMs;
        hours = Math.max(0, hours - (excessMs / (1000 * 60 * 60)));
        this.logger.log(`⚠️ Pause dépassée de ${Math.round(excessMs / 60000)} minutes pour l'employé ${employeeId}. Dépassement soustrait.`);
      } else {
        this.logger.log(`☕ Pause respectée (${Math.round(actualBreakMs / 60000)} min <= ${shift.breakDurationMinutes} min). Aucun retrait.`);
      }
    }

    // Moteur d'Heures Supplémentaires (Loi Québécoise - Seuil de 40h/semaine)
    await this.applyOvertimeRules(employeeId, hours, shift, tenantId);

    const savedEntry = await this.timeEntryRepository.save(timeEntry);

    // Finaliser le statut du shift
    shift.status = ShiftStatus.COMPLETED;
    shift.actualEndTime = now;
    await this.shiftRepository.save(shift);

    this.logger.log(`📤 Pointage DÉPART réussi via QR Code pour l'employé ${employeeId} à ${now.toLocaleTimeString()}`);
    return savedEntry;
  }

  async startBreak(employeeId: string, shiftId: string, tenantId: string): Promise<Shift> {
    const shift = await this.findOne(shiftId, tenantId);

    if (shift.employeeId !== employeeId) {
      throw new BadRequestException('Vous ne pouvez pas modifier le quart d\'un autre collaborateur.');
    }

    if (shift.status !== ShiftStatus.IN_PROGRESS) {
      throw new BadRequestException('Vous ne pouvez prendre une pause que pour un quart de travail actif.');
    }

    if (shift.breakStartTime) {
      throw new BadRequestException('Vous avez déjà débuté votre pause pour ce quart.');
    }

    shift.breakStartTime = new Date();
    const updatedShift = await this.shiftRepository.save(shift);
    this.logger.log(`☕ Début de la pause réussi pour l'employé ${employeeId}`);
    return updatedShift;
  }

  async endBreak(employeeId: string, shiftId: string, tenantId: string): Promise<Shift> {
    const shift = await this.findOne(shiftId, tenantId);

    if (shift.employeeId !== employeeId) {
      throw new BadRequestException('Vous ne pouvez pas modifier le quart d\'un autre collaborateur.');
    }

    if (shift.status !== ShiftStatus.IN_PROGRESS) {
      throw new BadRequestException('Le quart de travail associé n\'est pas en cours.');
    }

    if (!shift.breakStartTime) {
      throw new BadRequestException('Vous n\'avez pas encore débuté de pause pour ce quart.');
    }

    if (shift.breakEndTime) {
      throw new BadRequestException('Votre pause a déjà été complétée.');
    }

    shift.breakEndTime = new Date();
    const updatedShift = await this.shiftRepository.save(shift);
    this.logger.log(`☕ Fin de la pause réussie pour l'employé ${employeeId}`);
    return updatedShift;
  }

  // ── Algorithmes Métier Avancés ─────────────────────────────────────────────

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Rayon moyen de la Terre en mètres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  }

  private async applyOvertimeRules(employeeId: string, newHours: number, shift: Shift, tenantId: string): Promise<void> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Dimanche de la semaine en cours
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Obtenir tous les shifts complétés de l'employé cette semaine
    const shiftsThisWeek = await this.shiftRepository.find({
      where: {
        employeeId,
        tenantId,
        status: ShiftStatus.COMPLETED,
        startTime: Between(startOfWeek, endOfWeek),
      },
    });

    let totalHours = 0;
    for (const s of shiftsThisWeek) {
      if (s.id !== shift.id && s.actualStartTime && s.actualEndTime) {
        const diffMs = s.actualEndTime.getTime() - s.actualStartTime.getTime();
        let h = diffMs / (1000 * 60 * 60);
        
        if (s.breakStartTime && s.breakEndTime) {
          const actualBreakMs = s.breakEndTime.getTime() - s.breakStartTime.getTime();
          const allowedBreakMs = s.breakDurationMinutes * 60 * 1000;
          if (actualBreakMs > allowedBreakMs) {
            h = Math.max(0, h - ((actualBreakMs - allowedBreakMs) / (1000 * 60 * 60)));
          }
        }
        
        totalHours += h;
      }
    }

    if (totalHours + newHours > 40) {
      shift.isOvertime = true;
      shift.overtimeRate = 1.5; // Taux de majoration standard québécois
      this.logger.log(`⚖️ Seuil réglementaire de 40h franchi pour l'employé ${employeeId}. Quart actuel marqué OVERTIME 1.5x`);
    } else {
      shift.isOvertime = false;
    }
  }

  async publish(startDate: string, endDate: string, tenantId: string): Promise<{ publishedCount: number }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Dates de début ou de fin invalides.');
    }

    // Sélectionner tous les shifts en DRAFT dans cet intervalle de temps pour cette entreprise
    const drafts = await this.shiftRepository.find({
      where: {
        tenantId,
        status: ShiftStatus.DRAFT,
        startTime: Between(start, end),
      },
    });

    if (drafts.length === 0) {
      return { publishedCount: 0 };
    }

    // Mettre à jour leur statut en SCHEDULED
    for (const shift of drafts) {
      shift.status = ShiftStatus.SCHEDULED;
    }

    await this.shiftRepository.save(drafts);
    this.logger.log(`📢 ${drafts.length} quarts de travail publiés pour le tenant ${tenantId} (${startDate} - ${endDate})`);

    return { publishedCount: drafts.length };
  }
}
