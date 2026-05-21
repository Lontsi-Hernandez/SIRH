# 🔗 Spécifications des APIs REST — Gestion des Horaires & Présences (Shifts)

Ce document décrit le contrat d'interface des points de terminaison (Endpoints) de l'API REST du module Shifts, sécurisé en multi-tenant et documenté via OpenAPI.

---

## 1. 🌐 Liste des Endpoints REST

Tous les endpoints nécessitent un token Bearer JWT et injectent le header `X-Tenant-ID` de manière obligatoire.

```
[BASE URL: /api/v1]
```

### 🗓️ A. Planification des Horaires (`/shifts`)

#### 1. `GET /shifts`
*   **Description** : Récupérer la liste des horaires planifiés sur une période donnée.
*   **Rôles autorisés** : `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE` (l'employé ne voit que ses propres horaires).
*   **Query Parameters** :
    *   `startDate` (ISO Date, obligatoire)
    *   `endDate` (ISO Date, obligatoire)
    *   `employeeId` (UUID, facultatif, filtrage manager)
*   **Réponse standard (200 OK)** :
    ```json
    [
      {
        "id": "7a26fde3-ee99-4d66-a621-0fb4a9463941",
        "employeeId": "e309f4b5-82dd-4ca7-9c98-1e428254c46f",
        "startTime": "2026-05-24T08:00:00Z",
        "endTime": "2026-05-24T16:00:00Z",
        "status": "PLANNED",
        "type": "STANDARD",
        "note": "Quart de jour à l'entrepôt principal"
      }
    ]
    ```

#### 2. `POST /shifts`
*   **Description** : Planifier un nouveau quart de travail.
*   **Rôles autorisés** : `ADMIN`, `HR`, `MANAGER`.
*   **Body (JSON)** :
    ```json
    {
      "employeeId": "e309f4b5-82dd-4ca7-9c98-1e428254c46f",
      "startTime": "2026-05-24T08:00:00Z",
      "endTime": "2026-05-24T16:00:00Z",
      "type": "STANDARD",
      "note": "Quart de jour"
    }
    ```
*   **Réponse standard (210 Created)**.

#### 3. `PUT /shifts/:id`
*   **Description** : Mettre à jour (ou déplacer via Drag & Drop) un quart de travail existant.
*   **Rôles autorisés** : `ADMIN`, `HR`, `MANAGER`.
*   **Body (JSON)** : Permet de modifier le `startTime`, `endTime`, `employeeId` (pour réaffectation) ou le `status`.

#### 4. `DELETE /shifts/:id`
*   **Description** : Supprimer un quart de travail.
*   **Rôles autorisés** : `ADMIN`, `HR`, `MANAGER`.

---

### 🕒 B. Pointage en Temps Réel & Sécurité QR Code (`/shifts/qr-code`, `/shifts/clock-in`, `/shifts/clock-out`)

#### 1. `GET /shifts/qr-code`
*   **Description** : Génère un token cryptographique sécurisé dynamique pour le pointage physique (valable 5 minutes). L'écran de la station de pointage interroge cet endpoint pour afficher et rafraîchir le QR Code.
*   **Rôles autorisés** : `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE` (permet à toute station de confiance ou écran connecté de générer le QR).
*   **Réponse standard (200 OK)** :
    ```json
    {
      "qrCodeToken": "tenantId:1779143493726:ab45cf98e3b3200ff973c...",
      "expiresAt": "2026-05-20T19:45:00Z"
    }
    ```

#### 2. `POST /shifts/clock-in`
*   **Description** : Déclencher un pointage d'arrivée (Clock In) pour le collaborateur authentifié via scan de QR Code.
*   **Rôles autorisés** : `EMPLOYEE`, `MANAGER`, `HR`, `ADMIN`.
*   **Body (JSON)** :
    ```json
    {
      "shiftId": "7a26fde3-ee99-4d66-a621-0fb4a9463941",
      "qrCodeToken": "tenantId:1779143493726:ab45cf98e3b3200ff973c...",
      "latitude": 45.5017,
      "longitude": -73.5673,
      "deviceInfo": "iPhone 14 / Safari"
    }
    ```
*   **Réponse standard (201 Created)** :
    ```json
    {
      "id": "e9b2512f-9811-477d-b5b4-d50d60aa2a33",
      "employeeId": "e309f4b5-82dd-4ca7-9c98-1e428254c46f",
      "clockIn": "2026-05-24T07:58:32Z",
      "status": "APPROVED"
    }
    ```

#### 3. `POST /shifts/clock-out`
*   **Description** : Déclencher un pointage de départ (Clock Out) via scan de QR Code.
*   **Rôles autorisés** : `EMPLOYEE`, `MANAGER`, `HR`, `ADMIN`.
*   **Body (JSON)** :
    ```json
    {
      "shiftId": "7a26fde3-ee99-4d66-a621-0fb4a9463941",
      "qrCodeToken": "tenantId:1779143493726:ab45cf98e3b3200ff973c...",
      "latitude": 45.5020,
      "longitude": -73.5670
    }
    ```

---

## 2. 🛡️ Validation & Codes d'Erreurs Communs

*   **`400 Bad Request`** :
    *   *Causes* : Plage horaire invalide (`startTime` après `endTime`), chevauchement d'horaires détecté pour le même employé, ou coordonnées de géofencing en dehors de la zone autorisée (> 200m de la résidence/chantier).
*   **`401 Unauthorized`** :
    *   *Causes* : Absence de jeton Bearer valide ou expiré.
*   **`403 Forbidden`** :
    *   *Causes* : Rôle insuffisant pour effectuer l'action (ex: un simple employé essayant de créer un shift) ou violation d'accès inter-tenant (tentative d'accès à un planning appartenant à un autre `tenantId`).
