# 🗺️ Workflows Métier & Processus — Gestion des Horaires & Présences (Shifts)

Ce document décrit les processus d'affaires et les flux logiques automatisés implémentés pour la gestion des horaires et des pointages.

---

## 1. 📍 Workflow A : Pointage d'Arrivée (Clock In) avec Validation QR Code Obligatoire

Ce workflow s'exécute lorsqu'un employé souhaite pointer son arrivée (ou son départ) en scannant le QR Code sécurisé affiché sur la borne ou l'écran du manager.

```mermaid
flowchart TD
    A[Employé ouvre l'appareil photo dans l'app] --> B[Scan du QR Code de la Borne / Écran Manager]
    B --> C[Extraction du Token QR Code sécurisé]
    C --> D[Envoi du Token au Backend (POST /shifts/clock-in)]
    D --> E{Validation Signature Cryptographique ?}
    E -- Invalide --> F[Erreur: Signature corrompue ou faux QR Code]
    E -- Valide --> G{Validation de la Date (Expiration 5 min) ?}
    G -- Expiré --> H[Erreur: QR Code expiré, veuillez scanner le QR actuel]
    G -- Valide --> I{Validation du Tenant (Entreprise) ?}
    I -- Incohérent --> J[Erreur: Ce QR Code appartient à une autre entreprise]
    I -- Cohérent --> K[Enregistrer Pointage Entrée]
    K --> L{Pointage dans la fenêtre (+5 min) ?}
    L -- Non --> M[Marquer statut du shift: LATE & Notifier manager]
    L -- Oui --> N[Marquer statut du shift: ACTIVE]
    M --> O[Enregistrer pointage dans TimeEntry]
    N --> O
```

---

## 2. ⏰ Workflow B : Détection Automatique des Retards et Absences (Cron Job)

Un processus en arrière-plan (NestJS Schedule) s'exécute toutes les **5 minutes** pour auditer les shifts en attente et détecter les anomalies.

1.  **Requête de balayage** : Recherche de tous les shifts au statut `PLANNED` dont l'heure de début théorique (`startTime`) est dépassée de plus de **15 minutes** et pour lesquels aucune entrée de pointage d'arrivée (`TimeEntry`) n'a été liée.
2.  **Changement de statut - Retard** :
    *   Le statut du shift bascule automatiquement de `PLANNED` à `LATE`.
    *   Un événement `ShiftLateDetectedEvent` est émis.
    *   Une notification push et un message WebSocket en temps réel sont envoyés au gestionnaire direct de l'employé.
3.  **Changement de statut - Absence** :
    *   Si l'heure de début théorique du shift est dépassée de plus de **2 heures** sans pointage, le système bascule le statut du shift à `ABSENT`.
    *   Une alerte d'absence injustifiée critique est levée dans le module d'administration pour déclencher une action de remplacement.

---

## ⚖️ Workflow C : Calcul des Heures Supplémentaires (Norme Québécoise)

Lorsqu'un pointage de départ (Clock Out) est enregistré avec succès, le système recalcule automatiquement les heures de travail validées pour la semaine afin de détecter le déclenchement des heures supplémentaires :

1.  **Récupération de la semaine** : Récupérer toutes les entrées de pointage validées (`TimeEntry`) de l'employé pour la semaine en cours (du dimanche au samedi ou selon le paramétrage du tenant).
2.  **Calcul du cumul hebdomadaire** : Additionner la durée de toutes les entrées validées pour obtenir le cumul `totalHoursThisWeek`.
3.  **Application du seuil de 40 heures** :
    *   *Si* `totalHoursThisWeek <= 40` : Les heures de la journée sont comptabilisées comme `STANDARD`.
    *   *Si* `totalHoursThisWeek > 40` :
        *   Les heures sous le seuil des 40 heures cumulées restent au taux normal `1.0x`.
        *   Toutes les heures travaillées au-delà du seuil de 40 heures sont marquées avec le tag `OVERTIME` (heures supplémentaires) et associées à une majoration automatique de **1.5x** en vue du traitement dans le module Paie.
4.  **Enregistrement de l'audit log** : Un log d'audit scellé est consigné pour prouver la conformité du calcul en cas de contrôle des Normes du Travail.
