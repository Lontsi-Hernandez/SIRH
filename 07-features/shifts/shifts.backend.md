# ⚙️ Spécifications du Backend NestJS — Gestion des Horaires & Présences (Shifts)

Ce document détaille l'implémentation de la couche logicielle backend dans le cadre de la Clean Architecture NestJS pour le module Shifts.

---

## 1. 🏗️ Structure de Répertoires Modulaire

Le module s'implémente sous `backend/src/` et s'aligne sur l'architecture découplée globale :

```
src/
├── domain/
│   └── entities/
│       └── shift.entity.ts         # Modèle TypeORM Shift
├── application/
│   └── shifts/                     # Architecture CQRS (Commands & Queries)
│       ├── commands/
│       │   ├── create-shift.command.ts
│       │   └── clock-in.command.ts
│       └── queries/
│           └── get-shifts.query.ts
├── web/
│   ├── controllers/
│   │   └── shifts.controller.ts     # Routes HTTP REST + Swagger
│   ├── dtos/
│   │   └── shifts/
│   │       ├── create-shift.dto.ts  # Validation DTO Class-Validator
│   │       └── clock-in.dto.ts
│   └── modules/
│       └── shifts.module.ts        # Module centralisant TypeORM + Providers
```

---

## 2. 📝 Spécifications des Composants Logiciels

### A. Les DTOs de Validation (Class-Validator)
Chaque requête entrante est rigoureusement validée au niveau HTTP grâce à `class-validator` :

```typescript
// CreateShiftDto (f:\Projet\SIRH\SIRH\backend\src\web\dtos\shifts\create-shift.dto.ts)
export class CreateShiftDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsEnum(ShiftType)
  @IsOptional()
  type?: ShiftType;

  @IsString()
  @IsOptional()
  note?: string;
}
```

```typescript
// ClockInDto (f:\Projet\SIRH\SIRH\backend\src\web\dtos\shifts\clock-in.dto.ts)
export class ClockInDto {
  @IsUUID()
  @IsNotEmpty()
  shiftId: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsString()
  @IsOptional()
  qrCodeToken?: string;
}
```

---

### B. Le Contrôleur Sécurisé (RBAC & Multi-tenant)
Le contrôleur NestJS utilise les guards `JwtAuthGuard` et `RolesGuard` pour protéger les accès et s'assure de l'isolation du locataire via l'injection automatique du `tenantId`.

```typescript
@ApiTags('Horaires & Présences')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Planifier un nouveau quart de travail' })
  async create(@Body() dto: CreateShiftDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.commandBus.execute(new CreateShiftCommand(dto, tenantId));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Récupérer la liste des horaires' })
  async findAll(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('employeeId') employeeId: string,
    @Req() req: any
  ) {
    const tenantId = req.user.tenantId;
    // Si l'utilisateur est un simple EMPLOYEE, il ne peut voir que son horaire
    const targetEmployeeId = req.user.role === UserRole.EMPLOYEE ? req.user.id : employeeId;
    return this.queryBus.execute(new GetShiftsQuery(startDate, endDate, targetEmployeeId, tenantId));
  }
}
```

---

### C. Le Gestionnaire des Services & Métier (Logic)
*   **Géofencing** : Calcul de la distance géodésique en base ou par formule mathématique (loi de Haversine) entre le point de pointage et la coordonnée configurée du lieu de travail de l'employé.
*   **Retard Automatique** : Si le pointage est supérieur de plus de 5 minutes à l'heure planifiée, le statut du shift passe de `PLANNED` à `LATE` et un événement WebSocket est envoyé en temps réel.
*   **Majoration des Heures Supplémentaires (Loi Québécoise)** : Moteur de calcul intégré calculant le total des heures travaillées sur la semaine en cours. Dès que ce total franchit **40 heures**, les heures subséquentes sont estampillées `OVERTIME` avec un facteur multiplicateur de **1.5x** transmis aux logs de paie.
