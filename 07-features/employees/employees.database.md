# 🗄️ Schéma de Base de Données — Gestion des Employés (Employees)

Ce document spécifie la structure physique de la table `employees` dans PostgreSQL, ainsi que les index de performance et les colonnes d'audit requis.

---

## 1. 📝 Structure de la Table `employees`

Chaque ligne de cette table représente un dossier collaborateur lié à une entreprise spécifique.

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  hire_date DATE NOT NULL,
  termination_date DATE,
  department_id UUID,
  position_id UUID,
  custom_attributes JSONB DEFAULT '{}', -- Attributs de schéma dynamiques
  deleted_at TIMESTAMP WITH TIME ZONE, -- Gestion du Soft Delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID, -- Utilisateur ayant initié la création
  updated_by UUID  -- Utilisateur ayant fait la dernière modification
);
```

---

## 2. ⚡ Index de Performance

Pour optimiser les performances des recherches (qui sont toutes filtrées par entreprise en raison du multi-tenancy), les index uniques composés suivants sont créés :

> [!IMPORTANT]
> **Index 1 : `idx_employees_tenant_email`**
> - **Champs** : `tenant_id` + `email`
> - **Utilité** : Garantit l'unicité de l'email par entreprise et accélère la recherche par email lors de la connexion.

> [!NOTE]
> **Index 2 : `idx_employees_tenant_number`**
> - **Champs** : `tenant_id` + `employee_number`
> - **Utilité** : Garantit l'unicité du numéro matricule au sein d'une même entreprise.

> [!TIP]
> **Index 3 : `idx_employees_tenant_status`**
> - **Champs** : `tenant_id` + `status`
> - **Utilité** : Accélère les filtrages de la liste d'employés dans le Dashboard et les filtres de recherche.

---

## 3. 🛡️ Implémentation du Soft Delete (Suppression Logique)

Le système n'exécute jamais de requête `DELETE FROM employees`. 
- **Principe** : La colonne `deleted_at` est initialement à `null`.
- **Archivage** : Lors d'une suppression, le système enregistre l'horodatage actuel dans `deleted_at`.
- **Filtrage automatique** : Toutes les requêtes de l'application via TypeORM intègrent automatiquement la clause de filtrage `WHERE deleted_at IS NULL` pour masquer les fiches archivées, sauf demande d'extraction d'historique explicite.

---

## 🔒 Colonnes d'Audit Système
Afin de répondre aux normes de conformité et de sécurité, chaque table intègre les colonnes d'historisation suivantes :
- `created_at` : Date et heure d'enregistrement initial.
- `updated_at` : Date et heure de la dernière mise à jour.
- `created_by` : UUID de l'utilisateur (RH/CEO) à l'origine de l'embauche.
- `updated_by` : UUID de l'utilisateur ayant apporté la dernière modification sur le profil.
