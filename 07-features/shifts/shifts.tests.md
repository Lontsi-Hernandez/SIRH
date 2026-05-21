# 🧪 Plan de Validation & Tests — Gestion des Horaires & Présences (Shifts)

Ce document décrit la stratégie de test et définit la suite de tests automatisés (Unitaires, Intégration, E2E) nécessaires pour garantir la fiabilité du module Shifts.

---

## 1. 🎯 Stratégie Globale de Test

Pour assurer une résilience totale face aux modifications futures du code, notre couverture de tests respecte la pyramide des tests et cible en priorité les algorithmes clés du système.

```
                  ┌───────────────┐
                  │   Tests E2E   │  <-- Pointage complet (Playwright)
                  └───────────────┘
                ┌───────────────────┐
                │Tests d'Intégration│  <-- Isolation Multi-Tenant (Supertest)
                └───────────────────┘
              ┌───────────────────────┐
              │    Tests Unitaires    │  <-- Formule Haversine & Heures Supp
              └───────────────────────┘
```

---

## 2. 🧪 Suite de Tests Spécifiques

### A. Tests Unitaires (Business Logic)
*   **Emplacement** : `backend/src/domain/tests/shifts.spec.ts`
*   **Objectifs** :
    1.  **Formule de Haversine** : Valider que le calcul de la distance en mètres entre deux coordonnées géographiques (latitude/longitude) est exact (précision à 1 mètre près).
    2.  **Moteur d'Heures Supplémentaires** : Valider qu'une série de feuilles de temps totalisant 43 heures sur une semaine génère exactement 40 heures standards et 3 heures majorées à 1.5x.
    3.  **Temps de pause** : Valider que le système soustrait automatiquement la pause réglementaire non payée de 30 minutes après 5 heures de travail continu.

### B. Tests d'Intégration (Sécurité & Base de Données)
*   **Emplacement** : `backend/src/persistence/tests/shifts.integration.spec.ts`
*   **Objectifs** :
    1.  **Isolation Multi-Tenant** : Simuler deux requêtes simultanées de locataires différents (Tenant A et Tenant B). Valider que Tenant A reçoit une erreur `403 Forbidden` s'il tente d'interroger la table `shifts` du Tenant B.
    2.  **Contrainte de non-chevauchement** : Tenter d'insérer en base de données un shift de `08:00 à 16:00` et un autre de `12:00 à 20:00` pour le même employé le même jour. Valider que la base PostgreSQL rejette l'insertion et renvoie une violation de contrainte d'exclusion.

### C. Tests de Bout en Bout / E2E (Simulations Utilisateurs)
*   **Emplacement** : `backend/test/shifts.e2e-spec.ts`
*   **Objectifs** :
    1.  **Workflow de Pointage valide** :
        *   Se connecter en tant qu'employé.
        *   Envoyer une requête de pointage d'arrivée (`POST /shifts/clock-in`) avec des coordonnées GPS situées à 50 mètres du travail.
        *   Valider que le statut renvoyé est `201 Created` et que l'état du shift passe à `ACTIVE`.
    2.  **Répression de la fraude (Hors-Zone)** :
        *   Envoyer une requête de pointage d'arrivée avec des coordonnées GPS situées à 2 kilomètres du lieu de travail.
        *   Valider que le serveur répond avec un code d'erreur `400 Bad Request` et un message indiquant l'éloignement excessif.
