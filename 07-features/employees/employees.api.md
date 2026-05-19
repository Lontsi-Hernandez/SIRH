# 🔌 Spécifications API & Contrats — Gestion des Employés (Employees)

Ce document définit les contrats d'API REST pour toutes les opérations de gestion des employés au sein du SIRH.

---

## 1. 🏢 Isolation Multi-Tenant dans les Requêtes
Toutes les requêtes (sauf mention contraire) exigent les en-têtes suivants pour isoler les données :

```http
Authorization: Bearer <token_jwt>
x-tenant-id: <uuid_tenant_actif>
```

---

## 2. 📍 Points d'Entrée (Endpoints)

| Méthode | Chemin | Description | Droits Requis |
|---|---|---|---|
| **GET** | `/api/v1/employees` | Liste paginée et filtrée des employés | `employee.read` |
| **GET** | `/api/v1/employees/:id` | Récupère le profil complet 360° | `employee.read` |
| **POST** | `/api/v1/employees` | Crée une nouvelle fiche employé | `employee.create` |
| **PATCH** | `/api/v1/employees/:id` | Mise à jour partielle d'un employé | `employee.update` |
| **DELETE** | `/api/v1/employees/:id` | Soft delete (archivage logique) | `employee.archive` |

---

## 3. 🔍 Spécifications Techniques des Appels

### 👥 Liste paginée (`GET /employees`)
- **Paramètres de requête (Query Params)** :
  - `page` : Numéro de page (par défaut `1`).
  - `limit` : Nombre d'éléments par page (par défaut `10`).
  - `search` : Recherche textuelle libre (nom, email, matricule).
  - `departmentId` : Filtre par département (optionnel).
  - `status` : Filtre par statut (Actif, Suspendu, etc. optionnel).

### 📥 Création d'un employé (`POST /employees`)
- **Corps de la requête (Request Body)** :
```json
{
  "firstName": "Sophie",
  "lastName": "Gagnon",
  "email": "s.gagnon@quebec-inc.com",
  "hireDate": "2026-05-19",
  "departmentId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "positionId": "e1d2c3b4-a5f6-7e8d-9c0b-1a2b3c4d5e6f"
}
```

---

## 4. 📦 Format Standardisé des Réponses (Standard Response)

L'API répond systématiquement sous une enveloppe structurée et prévisible :

### 🟢 Exemple de succès (`200 OK` / `201 Created`) :
```json
{
  "data": {
    "id": "8f8e8d8c-8b8a-8f8e-8d8c-8b8a8f8e8d8c",
    "employeeNumber": "EMP-2026-001",
    "firstName": "Sophie",
    "lastName": "Gagnon",
    "email": "s.gagnon@quebec-inc.com",
    "status": "ACTIVE",
    "hireDate": "2026-05-19T00:00:00.000Z",
    "departmentId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "positionId": "e1d2c3b4-a5f6-7e8d-9c0b-1a2b3c4d5e6f"
  },
  "meta": {
    "timestamp": "2026-05-19T11:36:00Z",
    "version": "v1"
  },
  "errors": []
}
```

---

## 5. ❌ Gestion des Erreurs et Codes Spécifiques

En cas d'échec, le tableau `errors` contient les détails de l'erreur avec les codes standards suivants :

| Code HTTP | Libellé | Raison du blocage |
|---|---|---|
| **`400 Bad Request`** | Validation échouée | Saisie incorrecte (ex: format email invalide ou date d'embauche dans le futur). |
| **`401 Unauthorized`** | Non authentifié | Jeton d'accès manquant, expiré ou invalide. |
| **`403 Forbidden`** | Tenant mismatch / Droits insuffisants | Tentative d'accès à un employé d'une autre entreprise OU rôle insuffisant. |
| **`404 Not Found`** | Employee not found | L'UUID fourni ne correspond à aucun employé actif ou archivé dans ce tenant. |
| **`409 Conflict`** | Duplicate employee email | L'adresse email professionnelle est déjà utilisée par un autre employé au sein de cette même entreprise. |
