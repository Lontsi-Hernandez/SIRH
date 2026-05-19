-- ─────────────────────────────────────────────────────────────────────────────
-- HRMS — Script d'initialisation de la base de données
-- ─────────────────────────────────────────────────────────────────────────────

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Pour la recherche full-text

-- Schéma multi-tenant (chaque tenant aura son schéma)
-- Le schéma 'public' est utilisé pour les tables globales

-- ─── Types Enum ────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE');
CREATE TYPE employee_status AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');
CREATE TYPE leave_type AS ENUM ('VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID');
CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE shift_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'ABSENT', 'CANCELLED');
CREATE TYPE recruitment_status AS ENUM ('OPEN', 'IN_REVIEW', 'INTERVIEWING', 'OFFER_SENT', 'HIRED', 'CLOSED');
CREATE TYPE application_status AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'REJECTED');
CREATE TYPE notification_type AS ENUM ('SHIFT_CHANGE', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'PAYROLL_READY', 'ANNOUNCEMENT', 'TASK_ASSIGNED');

-- ─── Message d'initialisation ───────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE 'HRMS Database initialized successfully!';
END $$;
