# 🏢 Guide d'Architecture : Cloisonnement Multi-Entreprises & Multi-Succursales (Multi-Tenant)

Ce document décrit comment le projet SIRH assure une séparation étanche des données pour **plusieurs entreprises (Tenants)**, chacune possédant ses propres **succursales (Branches)** de façon totalement cloisonnée et transparente.

---

## 🗺️ Visualisation de la Hiérarchie des Données

Chaque entité de la base de données appartient à un `tenant_id` unique (UUID) qui assure une isolation totale. Les départements et les employés sont ensuite regroupés au sein de succursales physiques.

```mermaid
graph TD
    subgraph Multi-Tenant [Cloisonnement Base de Données]
        T1["🏢 Tenant A : SIRH Québec Inc. (quebec-inc)"]
        T2["🏢 Tenant B : Horizon Tech Solutions (horizon-tech)"]
    end

    subgraph Tenant A [SIRH Québec Inc.]
        B1["📍 Succursale MTL (Montréal)"]
        B2["📍 Succursale QBC (Québec)"]
        
        D1["📁 RH (MTL)"] --> B1
        D2["📁 IT (MTL)"] --> B1
        D3["📁 Opérations (QBC)"] --> B2
        
        E1["👥 Jean (CEO)"] --> B1
        E2["👥 Sophie (HR)"] --> B1
        E3["👥 Marc-André (Dev)"] --> B1
        E4["👥 Élise (Manager)"] --> B2
    end

    subgraph Tenant B [Horizon Tech Solutions]
        B3["📍 Succursale TOR (Toronto)"]
        B4["📍 Succursale VAN (Vancouver)"]
        
        D4["📁 Engineering (TOR)"] --> B3
        D5["📁 Success (VAN)"] --> B4
        
        E5["👥 Alice (CEO)"] --> B3
        E6["👥 Bob (Dev)"] --> B3
        E7["👥 Charlie (CS)"] --> B4
    end

    T1 === Tenant A
    T2 === Tenant B
```

---

## 🔒 1. Cloisonnement au niveau Base de Données (Persistence)

Toutes les entités clés possèdent une relation obligatoire avec l'entité `Tenant` :
- `Tenant` : Représente l'entreprise elle-même (ex: `quebec-inc` ou `horizon-tech`).
- `Branch` : Représente une succursale physique d'un tenant.
- `Employee`, `Department`, `Position`, `Shift`, `Leave` : Rattachés à un `tenantId` ET à un `branchId`.

### Indexations Composées de Sécurité
Pour interdire toute collision de données (comme deux employés avec le même courriel dans deux entreprises distinctes), nous utilisons des **index uniques composés** dans TypeORM (`employee.entity.ts`) :
```typescript
@Index('idx_employees_tenant_email', ['tenantId', 'email'], { unique: true })
@Index('idx_employees_tenant_number', ['tenantId', 'employeeNumber'], { unique: true })
```

---

## 🚦 2. Résolution Dynamique du Tenant (Backend Middleware)

Le backend extrait de manière transparente l'identité de l'entreprise courante pour chaque requête entrante grâce au `TenantMiddleware` :

1.  **En-tête API** : Recherche l'en-tête HTTP `X-Tenant-ID`.
2.  **JWT Claim** : Si l'utilisateur est connecté, extrait le `tenantId` inclus de manière sécurisée dans la charge utile (payload) du jeton JWT local ou Keycloak.
3.  **Sous-domaine** : Extrait dynamiquement le slug du sous-domaine (ex: `quebec-inc.sirh.ca` -> tenant `quebec-inc`).
4.  **Fallback de Développement Intelligent** : Si aucune donnée n'est fournie en mode développement, il résout l'entreprise par défaut ou sélectionne automatiquement la première entreprise active dans PostgreSQL pour éviter tout blocage.

---

## 👥 3. Données de Test de Démonstration Réelles (Seeding)

Pour valider l'étanchéité multi-entreprises, le script de peuplement `database-seeder.ts` a été configuré pour générer **deux entreprises complètes** indépendantes :

### 🏢 Entreprise 1 : SIRH Québec Inc. (Slug: `quebec-inc`)
- **Succursales** : 
  - `MTL` (Montréal) — Gérée par **Jean Tremblay** (CEO & `SUPER_ADMIN`).
  - `QBC` (Québec) — Gérée par **Élise Dubois** (Manager).
- **Départements** : 
  - `RH (MTL)`, `Ingénierie & IT (MTL)`, `Opérations Terrain (QBC)`.
- **Employés & Comptes** :
  - `ceo@quebec-inc.com` (Jean - Super Admin)
  - `hr@quebec-inc.com` (Sophie - RH)
  - `developer@quebec-inc.com` (Marc-André - Employé)
  - `manager-mtl@quebec-inc.com` (Élise - Manager)
- **Pointages demo** : Pointages complets planifiés et complétés sur la succursale de Montréal.

### 🏢 Entreprise 2 : Horizon Tech Solutions (Slug: `horizon-tech`)
- **Succursales** : 
  - `TOR` (Toronto Head Office) — Gérée par **Alice Smith** (CEO & `SUPER_ADMIN`).
  - `VAN` (Vancouver Office) — Gérée par **Charlie Brown** (CS Manager).
- **Départements** : 
  - `Software Engineering (TOR)`, `Customer Success (VAN)`.
- **Employés & Comptes** :
  - `ceo@horizon-tech.com` (Alice - Super Admin)
  - `developer@horizon-tech.com` (Bob - Employé)
  - `charlie@horizon-tech.com` (Charlie - Manager)
- **Pointages demo** : Pointages complets planifiés et complétés sur la succursale de Toronto.

---

## 🎨 4. Interface Utilisateur Dynamique Multi-Entreprises & Multi-Succursales

### Page de Connexion Multi-Entreprises
Lors de la connexion, le formulaire requiert le **Code Entreprise** (`tenantId` ou slug) :
- Saisir `quebec-inc` pour se connecter à SIRH Québec Inc.
- Saisir `horizon-tech` pour se connecter à Horizon Tech Solutions.

### Header & Barre Latérale (Sidebar) Intelligentes
Le payload d'authentification a été enrichi pour renvoyer le nom de l'entreprise (`tenantName`) et de la succursale de l'employé (`branchName`). 

Désormais, dès qu'un utilisateur se connecte, la barre latérale s'adapte dynamiquement pour afficher fièrement :
- Le **Nom de son entreprise** sous le logo principal (avec une icône 🏢).
- La **Succursale d'affectation** de l'utilisateur connecté (avec une icône 📍).

---

## 🛠️ Instructions pour Initialiser les Données Localement

Pour appliquer ce jeu de données multi-entreprises étanche sur votre base de données locale, exécutez les deux commandes suivantes dans le dossier `backend` :

```bash
# 1. Nettoyer les schémas existants
npm run db:clean

# 2. Peupler la base de données avec le jeu de données multi-tenant et multi-succursales
npm run seed
```
