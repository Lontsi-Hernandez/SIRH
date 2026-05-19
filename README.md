# 🏢 HRMS — Human Resource Management System

> Système d'Information des Ressources Humaines complet, multi-secteurs, multi-tenant avec conformité légale québécoise/canadienne native.

[![NestJS](https://img.shields.io/badge/Backend-NestJS-e0234e?logo=nestjs)](https://nestjs.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Infra-Docker-2496ed?logo=docker)](https://docker.com)

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation rapide](#installation-rapide)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet)
- [Modules fonctionnels](#modules-fonctionnels)
- [API Documentation](#api-documentation)
- [Roadmap](#roadmap)

---

## 🌟 Vue d'ensemble

HRMS couvre l'ensemble du cycle de vie RH :

| Module | Description |
|--------|-------------|
| 👥 **Core RH** | Employés, organigramme, postes/départements, onboarding/offboarding, RBAC |
| 🗓️ **Temps & Présences** | Horaires drag&drop, pointage mobile/QR/géo, congés/absences |
| 💰 **Paie** | Calcul automatique, RRQ/RQAP/AE, export Nethris/ADP |
| 🔍 **Recrutement (ATS)** | Offres, pipeline candidatures, LinkedIn/Indeed |
| ⭐ **Performance** | Évaluations périodiques, objectifs & KPIs |
| 📚 **Formation** | Modules en ligne, certifications, suivi |
| 💬 **Communication** | Messagerie, annonces, notifications temps réel |
| 📈 **Analytics** | Tableaux de bord, coûts, taux de roulement, exports PDF/Excel |

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Mobile** | React Native + Expo |
| **Backend** | Node.js + NestJS + Clean Architecture + CQRS |
| **Base de données** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **ORM** | TypeORM |
| **Auth** | Keycloak (SSO, multi-tenant, RBAC) |
| **Temps réel** | WebSockets (Socket.io / NestJS Gateway) |
| **State** | Redux Toolkit |
| **Email** | SendGrid / SMTP |
| **Stockage** | AWS S3 (MinIO en développement) |
| **Infra** | Docker + Kubernetes |

---

## 🏛️ Architecture

```
Clean Architecture (NestJS)
├── Domain (src/domain/)          ← Entités, Enums, Exceptions, Interfaces
├── Application (src/application/) ← CQRS Commands & Queries
├── Infrastructure (src/infrastructure/) ← Auth, Email, S3, WebSockets
├── Persistence (src/persistence/) ← TypeORM, Migrations, Repositories
└── Web (src/web/)                ← Controllers, Guards, Middleware, DTOs
```

**Concepts clés :**
- 🔄 **CQRS** — Commands (écriture) et Queries (lecture) strictement séparés
- 🏢 **Multi-tenant** — `TenantMiddleware` injecte `tenant_id` dans chaque requête
- 🔐 **RBAC** — 4 rôles hiérarchiques : `ADMIN > HR > MANAGER > EMPLOYEE`
- 🌐 **WebSockets** — Notifications temps réel via NestJS Gateway
- 📦 **Shared types** — Types TypeScript partagés frontend ↔ mobile

---

## 📋 Prérequis

| Outil | Version minimale | Installation |
|-------|-----------------|--------------|
| Node.js | 18.0.0 | [nodejs.org](https://nodejs.org) |
| npm | 9.0.0 | Inclus avec Node.js |
| Docker Desktop | 4.0+ | [docker.com](https://docker.com/products/docker-desktop) |
| Git | 2.0+ | [git-scm.com](https://git-scm.com) |

---

## ⚡ Installation rapide

### Option 1 — Script automatique (recommandé)
```powershell
# Dans le dossier du projet
.\scripts\setup.ps1
```

### Option 2 — Manuelle
```powershell
# 1. Copier les variables d'environnement
Copy-Item .env.example .env

# 2. Démarrer les services Docker
docker-compose up -d postgres redis

# 3. Installer les dépendances
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. (Optionnel) Application mobile
cd mobile && npm install && cd ..
```

---

## 🚀 Démarrage

### Développement local

```powershell
# Terminal 1 — Backend NestJS
cd backend
npm run start:dev
# → http://localhost:3000/api/v1
# → http://localhost:3000/api/docs (Swagger)

# Terminal 2 — Frontend React
cd frontend
npm run dev
# → http://localhost:5173

# Terminal 3 — Mobile (optionnel)
cd mobile
npx expo start
```

### Avec Docker (tous les services)
```powershell
docker-compose up
```

### URLs de développement

| Service | URL | Identifiants |
|---------|-----|-------------|
| 🌐 Frontend | http://localhost:5173 | — |
| 🔗 API | http://localhost:3000/api/v1 | — |
| 📚 Swagger | http://localhost:3000/api/docs | — |
| 🔐 Keycloak | http://localhost:8080 | admin / admin123 |
| 💾 MinIO | http://localhost:9001 | minioadmin / minioadmin123 |
| 🗄️ PostgreSQL | localhost:5432 | hrms_user / hrms_password |
| ⚡ Redis | localhost:6379 | — |

---

## 📁 Structure du projet

```
f:/Projet/SIRH/
├── backend/                    ← NestJS + Clean Architecture
│   └── src/
│       ├── domain/
│       │   └── entities/       ← Employee, Shift, Leave, Payroll, ...
│       ├── application/
│       │   └── employees/      ← Commands + Queries (CQRS)
│       ├── infrastructure/
│       │   └── realtime/       ← WebSocket Gateway
│       └── web/
│           ├── controllers/    ← EmployeesController, ...
│           ├── guards/         ← RolesGuard (RBAC)
│           ├── middleware/     ← TenantMiddleware (multi-tenant)
│           ├── dtos/           ← CreateEmployeeDto, ...
│           └── modules/        ← EmployeesModule, AuthModule, ...
│
├── frontend/                   ← React + TypeScript + Vite
│   └── src/
│       ├── components/
│       │   └── layout/         ← AppLayout, Sidebar, Header
│       ├── pages/              ← Dashboard, Employees, Shifts, ...
│       ├── store/
│       │   └── slices/         ← authSlice, employeeSlice, ...
│       ├── services/           ← api.service.ts (Axios)
│       └── hooks/              ← useStore.ts
│
├── mobile/                     ← React Native + Expo
│
├── shared/
│   ├── types/                  ← Types TypeScript partagés
│   └── constants/              ← API endpoints, labels, taux légaux QC
│
├── scripts/
│   ├── init.sql                ← Init PostgreSQL
│   └── setup.ps1               ← Script d'installation
│
├── docker-compose.yml          ← PostgreSQL + Redis + Keycloak + MinIO
├── .env.example                ← Variables d'environnement (template)
└── README.md
```

---

## 📊 Roadmap

| Phase | Durée | Modules |
|-------|-------|---------|
| **Phase 1 — MVP** | 3-6 mois | Core RH + Horaires + Congés + Communication de base |
| **Phase 2 — Croissance** | 6-12 mois | Paie + Analytics + Recrutement |
| **Phase 3 — Maturité** | 12-18 mois | Formation + Performance + IA + Intégrations tierces |

---

## 🇨🇦 Conformité légale québécoise

- **RRQ** (Régime de rentes du Québec) — taux annuels intégrés
- **RQAP** (Régime québécois d'assurance parentale) — calcul employé + employeur
- **Assurance-emploi** — taux fédéraux employé/employeur
- **Types de congés** — Vacances, Maladie, Maternité, Paternité, Parental, Deuil, Compassion, Devoir de jury
- **Heures supplémentaires** — seuil 40h/semaine, multiplicateur 1.5x

---

## 🤝 Contribution

1. Créez une branche feature: `git checkout -b feature/nom-feature`
2. Respectez la Clean Architecture (ne jamais importer de NestJS dans le Domain)
3. Ajoutez des tests pour chaque Command et Query handler
4. Documentez les endpoints avec les décorateurs Swagger

---

*Généré le 2026-05-18 — HRMS v1.0.0*
