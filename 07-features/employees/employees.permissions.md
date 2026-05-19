# 🛡️ Droits & Habilitations — Gestion des Employés (Employees)

Ce document décrit en détail les permissions et règles de sécurité régissant l'accès aux fiches des collaborateurs.

---

## 1. 🔑 Liste des Permissions Spécifiques

Le module Employees intègre des permissions granulaires appliquées aux endpoints API et à l'interface client :

| Permission | Description technique | Rôles associés par défaut |
|---|---|---|
| **`employee.read`** | Permet de lister et de consulter le profil de base des collaborateurs (hors salaires). | `CEO`, `HR_ADMIN`, `MANAGER` |
| **`employee.create`** | Autorise la création d'une nouvelle fiche collaborateur (`DRAFT`). | `CEO`, `HR_ADMIN` |
| **`employee.update`** | Permet la mise à jour des informations d'un collaborateur existant. | `CEO`, `HR_ADMIN` (et `EMPLOYEE` pour son profil perso) |
| **`employee.archive`** | Autorise le basculement d'un collaborateur vers le statut `ARCHIVED` (soft-delete). | `CEO`, `HR_ADMIN` |
| **`employee.export`** | Permet l'extraction des données en masse (CSV, JSON, Excel, PDF). | `CEO`, `HR_ADMIN` |
| **`employee.salary.read`** | **Permission ultra-sensible** : Donne accès aux colonnes de rémunération et de paie. | `CEO`, `HR_ADMIN` (exclut `MANAGER`) |

---

## 2. 🧱 Isolation Multi-Tenant Stricte

La sécurité du SIRH repose sur une règle absolue de cloisonnement des données :

> [!IMPORTANT]
> **Règle d'or du Multi-tenant — Scoping par Tenant Obligatoire (Tenant-Scoped Only)**
> Aucun utilisateur (y compris un CEO) ne peut lire, modifier ou supprimer un employé qui appartient à une autre entreprise (autre `tenantId`).
> - **Au niveau de l'API** : Le middleware du backend injecte le `tenantId` issu du header validé dans chaque requête SQL de base de données.
> - **Au niveau SQL** : La clause `WHERE tenant_id = :tenantId` est injectée de manière invisible par TypeORM pour chaque jointure ou requête.
> - **Conséquence** : Toute tentative de modification d'un identifiant n'appartenant pas à l'entreprise courante lève immédiatement une erreur `403 Forbidden` ou `404 Not Found`.

---

## 👥 Matrice d'Accès par Rôles

- **`CEO` & `HR_ADMIN`** : Possèdent toutes les permissions (`employee.create`, `employee.update`, `employee.archive`, `employee.export`, `employee.salary.read`).
- **`MANAGER`** : Possède uniquement `employee.read` limitée aux employés déclarés sous sa supervision directe (équipe). Il ne peut pas voir les salaires ni modifier les fiches.
- **`EMPLOYEE`** : Ne possède aucune permission sur les autres collaborateurs. Il a un droit de lecture/écriture partiel sur son propre profil personnel (avec validation par l'équipe RH).
