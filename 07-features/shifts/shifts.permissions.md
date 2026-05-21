# 🔐 Sécurité & Permissions RBAC — Gestion des Horaires & Présences (Shifts)

Ce document spécifie la matrice des droits d'accès basée sur les rôles (RBAC) pour la consultation, la planification et le pointage au sein du module Shifts.

---

## 1. 🛡️ La Matrice de Permissions Rôles / Actions

Notre système applique un contrôle d'accès strict au niveau des contrôleurs NestJS et de l'interface utilisateur React. Les droits sont hiérarchiques et cloisonnés par locataire (tenant).

| Action / Ressource | Administrateur (`ADMIN`) | Spécialiste RH (`HR`) | Gestionnaire (`MANAGER`) | Employé (`EMPLOYEE`) |
| :--- | :---: | :---: | :---: | :---: |
| **Créer un Shift (`POST /shifts`)** | 🟢 Autorisé | 🟢 Autorisé | 🟢 Autorisé (son équipe) | 🔴 Refusé |
| **Modifier un Shift (`PUT /shifts/:id`)** | 🟢 Autorisé | 🟢 Autorisé | 🟢 Autorisé (son équipe) | 🔴 Refusé |
| **Supprimer un Shift (`DELETE /shifts/:id`)** | 🟢 Autorisé | 🟢 Autorisé | 🟢 Autorisé (son équipe) | 🔴 Refusé |
| **Consulter tous les Shifts** | 🟢 Autorisé | 🟢 Autorisé | 🟢 Autorisé (son équipe) | 🔴 Refusé (ses shifts uniquement) |
| **Consulter ses propres Shifts** | 🟢 Autorisé | 🟢 Autorisé | 🟢 Autorisé | 🟢 Autorisé |
| **Pointer Entrée/Sortie (`clock-in/out`)** | 🟢 Autorisé (perso) | 🟢 Autorisé (perso) | 🟢 Autorisé (perso) | 🟢 Autorisé (perso uniquement) |
| **Régulariser un pointage d'employé** | 🟢 Autorisé | 🟢 Autorisé | 🟢 Autorisé (son équipe) | 🔴 Refusé |
| **Approuver/Rejeter une feuille de temps** | 🟢 Autorisé | 🟢 Autorisé | 🟢 Autorisé (son équipe) | 🔴 Refusé |
| **Exporter les rapports d'heures** | 🟢 Autorisé | 🟢 Autorisé | 🔴 Refusé | 🔴 Refusé |

---

## 2. 📝 Règles de Sécurité Applicatives Majeures

### A. Isolation stricte du Tenant (Multi-Tenancy)
Chaque requête de création, de modification ou de consultation de shift doit obligatoirement transiter par la validation du `tenantId`. Un manager d'un locataire A ne peut sous aucun prétexte créer ou modifier un shift pour un collaborateur du locataire B, sous peine de déclencher instantanément une exception de sécurité `403 Forbidden` et de consigner un log d'alerte critique de niveau intrusion.

### B. Validation du pointage personnel
L'endpoint `/shifts/clock-in` vérifie que la personne authentifiée via le jeton JWT correspond exactement à l'identifiant `employeeId` du shift planifié. Un employé ne peut pas effectuer un pointage pour l'un de ses collègues. Le *Buddy Punching* est bloqué au niveau de l'API.

### C. Validation de la hiérarchie du Manager
Un utilisateur ayant le rôle `MANAGER` est rattaché à un ou plusieurs départements spécifiques. Ses droits de création et d'édition de shifts sont limités aux employés appartenant aux départements sous sa supervision directe. La couche application valide cette règle lors de l'exécution de la commande de planification.
