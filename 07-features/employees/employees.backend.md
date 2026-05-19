# ⚙️ Architecture Backend — Gestion des Employés (Employees)

Ce document décrit l'implémentation backend (NestJS + TypeORM) du module central de gestion des employés, respectant une architecture propre (Clean Architecture).

---

## 1. 📂 Architecture des Répertoires

Le module respecte une séparation stricte des préoccupations (Decoupled Layers) :

```text
backend/src/employees/
 ├── domain/           # Entités pures et règles métier fondamentales
 ├── application/      # Services métier, cas d'usage, DTOs, interfaces de dépôts
 ├── infrastructure/   # Implémentations concrètes (TypeORM, base de données, mails)
 └── web/              # Contrôleurs REST, passerelles WebSocket et API Contracts
```

---

## 2. 👤 Entité du Domaine (`Employee`)

L'entité pure qui régit l'identité d'un collaborateur au sein de l'organisation :

```typescript
export class Employee {
  id: string;               // UUID généré en base
  tenantId: string;         // Lien obligatoire vers le Tenant (isolation multi-tenant)
  employeeNumber: string;   // Numéro matricule unique (ex: EMP-2026-001)
  firstName: string;        // Prénom
  lastName: string;         // Nom
  email: string;            // Courriel professionnel unique par tenant
  status: EmployeeStatus;   // DRAFT, ACTIVE, SUSPENDED, TERMINATED, ARCHIVED
  hireDate: Date;           // Date d'embauche
  departmentId?: string;    // ID du département associé
  positionId?: string;      // ID du poste occupé
  deletedAt?: Date;         // Date d'archivage (Soft Delete)
}
```

---

## 3. 🛡️ Règles Métier Fondamentales (Business Rules)

Toute modification ou création d'employé doit passer par la validation stricte de ces trois règles d'affaires :

> [!IMPORTANT]
> **Règle 1 — Appartenance exclusive à un locataire (Tenant Ownership)**
> Un employé appartient à un et un seul locataire (Tenant). Il est techniquement impossible qu'un employé ait un `tenantId` nul ou soit rattaché à plusieurs entreprises.

> [!WARNING]
> **Règle 2 — Unicité de l'adresse email par entreprise (Unique Email per Tenant)**
> L'adresse email doit être unique **au sein du même tenant**. Un employé de "Entreprise A" peut utiliser l'adresse `jean.dupont@test.com` même si un employé de "Entreprise B" possède déjà cette adresse email.

> [!CAUTION]
> **Règle 3 — Archivage obligatoire (Soft Delete Mandatory)**
> Pour des raisons de traçabilité, de paie et de conformité légale, un employé n'est jamais définitivement supprimé de la base de données (pas de clause SQL `DELETE`). On applique un archivage logique via la colonne `deletedAt` (Soft Delete).

---

## 4. 🧬 Moteur de Schéma Dynamique (Dynamic Schema Engine)

Pour permettre l'extension de la fiche employé sans développement technique :
1.  **Configuration des Métadonnées** : Les administrateurs définissent des attributs personnalisés (ex: type: `string`, libellé: `Habilitation`, requis: `false`).
2.  **Stockage Flexible** : Les valeurs des champs personnalisés d'un employé sont sauvegardées dans une colonne de type **`jsonb`** nommée `custom_attributes` au sein de la table PostgreSQL.
3.  **Validation Dynamique** : Avant d'enregistrer, le service valide que les attributs saisis correspondent à la configuration (métadonnées) du tenant.

---

## 📞 Services, Audit & Événements

### 🛠️ `EmployeeService`
Gère les cas d'utilisation :
- `create(dto, tenantId)` : Valide l'unicité de l'email et du matricule, puis crée l'employé.
- `update(id, dto, tenantId)` : Met à jour partiellement la fiche de l'employé.
- `archive(id, tenantId)` : Applique le soft delete en renseignant `deleted_at`.
- `search(filters, tenantId)` : Effectue des recherches avancées paginées.

### 🛡️ Système d'Audit (Audit Logs)
Chaque action critique effectuée par un gestionnaire déclenche l'écriture d'un log d'audit non modifiable :
- *Création d'employé*, *Mise à jour d'infos*, *Archivage*.
- **Alerte renforcée** lors des modifications de **Rémunération** (`hourlyRate`, `annualSalary`) ou de **Rôle**.

### 📢 Événements Système émis (Event-Driven)
Lorsqu'une fiche employé change d'état, des événements sont publiés pour notifier les autres modules du SIRH :
- `EMPLOYEE_CREATED` : Informe le module **Accompagnement/Hébergement** pour attribuer un logement si requis.
- `EMPLOYEE_UPDATED` : Met à jour les permissions ou les plannings.
- `EMPLOYEE_ARCHIVED` : Notifie le module **Paie** pour générer le solde de tout compte.
