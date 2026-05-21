import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShiftsService } from './shifts.service';
import { Shift, ShiftStatus } from '../../domain/entities/shift.entity';
import { TimeEntry } from '../../domain/entities/user.entity';
import { Employee } from '../../domain/entities/employee.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ShiftsService Unit Tests', () => {
  let service: ShiftsService;
  let shiftRepositoryMock: any;
  let timeEntryRepositoryMock: any;
  let employeeRepositoryMock: any;

  beforeEach(async () => {
    shiftRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      remove: jest.fn(),
    };

    timeEntryRepositoryMock = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      findOne: jest.fn(),
    };

    employeeRepositoryMock = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: getRepositoryToken(Shift),
          useValue: shiftRepositoryMock,
        },
        {
          provide: getRepositoryToken(TimeEntry),
          useValue: timeEntryRepositoryMock,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
  });

  describe('1. Géofencing & Pointage (Clock In)', () => {
    it('devrait valider le pointage avec succès si l\'employé est dans la zone autorisée (<200m)', async () => {
      const shiftId = 'shift-uuid';
      const employeeId = 'employee-uuid';
      const tenantId = 'tenant-uuid';

      const mockShift = {
        id: shiftId,
        employeeId,
        tenantId,
        status: ShiftStatus.SCHEDULED,
        locationLat: 45.5017,
        locationLng: -73.5673, // Bureau principal Montréal
        notes: 'Test note',
      };

      shiftRepositoryMock.findOne.mockResolvedValue(mockShift);

      const dto = {
        shiftId,
        latitude: 45.5018, // Très proche (quelques mètres)
        longitude: -73.5672,
      };

      const result = await service.clockIn(employeeId, dto, tenantId);

      expect(result).toBeDefined();
      expect(result.employeeId).toBe(employeeId);
      expect(result.clockInLat).toBe(dto.latitude);
      expect(shiftRepositoryMock.save).toHaveBeenCalled();
      expect(mockShift.status).toBe(ShiftStatus.IN_PROGRESS);
    });

    it('devrait rejeter le pointage (BadRequestException) si l\'employé est hors-zone (>200m)', async () => {
      const shiftId = 'shift-uuid';
      const employeeId = 'employee-uuid';
      const tenantId = 'tenant-uuid';

      const mockShift = {
        id: shiftId,
        employeeId,
        tenantId,
        status: ShiftStatus.SCHEDULED,
        locationLat: 45.5017,
        locationLng: -73.5673, // Bureau principal Montréal
      };

      shiftRepositoryMock.findOne.mockResolvedValue(mockShift);

      const dto = {
        shiftId,
        latitude: 48.8566, // Paris (très loin de Montréal !)
        longitude: 2.3522,
      };

      await expect(service.clockIn(employeeId, dto, tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('2. Moteur d\'Heures Supplémentaires (Loi Québécoise - Seuil de 40h)', () => {
    it('devrait marquer le quart comme OVERTIME (1.5x) si le cumul de la semaine dépasse 40 heures', async () => {
      const shiftId = 'shift-uuid-current';
      const employeeId = 'employee-uuid';
      const tenantId = 'tenant-uuid';

      // Le quart en cours représente 8h
      const mockShift = {
        id: shiftId,
        employeeId,
        tenantId,
        status: ShiftStatus.IN_PROGRESS,
        breakDurationMinutes: 0,
        startTime: new Date(),
        endTime: new Date(),
        isOvertime: false,
      };

      shiftRepositoryMock.findOne.mockResolvedValue(mockShift);

      // On simule que l'employé a déjà complété 38h de quarts cette semaine
      const mockPastShifts = [
        {
          id: 'shift-1',
          status: ShiftStatus.COMPLETED,
          actualStartTime: new Date('2026-05-18T08:00:00Z'),
          actualEndTime: new Date('2026-05-18T18:00:00Z'), // 10h
          breakDurationMinutes: 0,
        },
        {
          id: 'shift-2',
          status: ShiftStatus.COMPLETED,
          actualStartTime: new Date('2026-05-19T08:00:00Z'),
          actualEndTime: new Date('2026-05-19T18:00:00Z'), // 10h
          breakDurationMinutes: 0,
        },
        {
          id: 'shift-3',
          status: ShiftStatus.COMPLETED,
          actualStartTime: new Date('2026-05-20T08:00:00Z'),
          actualEndTime: new Date('2026-05-20T18:00:00Z'), // 10h
          breakDurationMinutes: 0,
        },
        {
          id: 'shift-4',
          status: ShiftStatus.COMPLETED,
          actualStartTime: new Date('2026-05-21T08:00:00Z'),
          actualEndTime: new Date('2026-05-21T16:00:00Z'), // 8h
          breakDurationMinutes: 0,
        },
      ]; // Total passés = 38h

      shiftRepositoryMock.find.mockResolvedValue(mockPastShifts);

      // Session de pointage en cours
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 8); // Session de 8h
      timeEntryRepositoryMock.findOne.mockResolvedValue({
        id: 'time-entry-uuid',
        employeeId,
        tenantId,
        clockIn: clockInTime,
        clockOut: null,
      });

      const dto = {
        shiftId,
      };

      await service.clockOut(employeeId, dto, tenantId);

      // 38h + 8h = 46h (supérieur au seuil de 40h)
      expect(mockShift.isOvertime).toBe(true);
      expect(mockShift.overtimeRate).toBe(1.5);
    });

    it('ne devrait pas marquer le quart comme OVERTIME si le cumul de la semaine est inférieur ou égal à 40 heures', async () => {
      const shiftId = 'shift-uuid-current';
      const employeeId = 'employee-uuid';
      const tenantId = 'tenant-uuid';

      const mockShift = {
        id: shiftId,
        employeeId,
        tenantId,
        status: ShiftStatus.IN_PROGRESS,
        breakDurationMinutes: 0,
        startTime: new Date(),
        endTime: new Date(),
        isOvertime: false,
      };

      shiftRepositoryMock.findOne.mockResolvedValue(mockShift);

      // Cumul de 15h passées
      const mockPastShifts = [
        {
          id: 'shift-1',
          status: ShiftStatus.COMPLETED,
          actualStartTime: new Date('2026-05-18T08:00:00Z'),
          actualEndTime: new Date('2026-05-18T15:00:00Z'), // 7h
          breakDurationMinutes: 0,
        },
        {
          id: 'shift-2',
          status: ShiftStatus.COMPLETED,
          actualStartTime: new Date('2026-05-19T08:00:00Z'),
          actualEndTime: new Date('2026-05-19T16:00:00Z'), // 8h
          breakDurationMinutes: 0,
        },
      ];

      shiftRepositoryMock.find.mockResolvedValue(mockPastShifts);

      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 8); // Session de 8h
      timeEntryRepositoryMock.findOne.mockResolvedValue({
        id: 'time-entry-uuid',
        employeeId,
        tenantId,
        clockIn: clockInTime,
        clockOut: null,
      });

      const dto = {
        shiftId,
      };

      await service.clockOut(employeeId, dto, tenantId);

      // 15h + 8h = 23h (inférieur à 40h)
      expect(mockShift.isOvertime).toBe(false);
    });
  });
});
