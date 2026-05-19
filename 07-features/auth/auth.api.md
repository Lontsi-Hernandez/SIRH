# 🔌 Spécifications API — Authentification (Auth)

Ce document décrit en détail les points d'entrée (endpoints) de l'API REST d'authentification du SIRH, ainsi que les formats de requêtes, de réponses et de gestion des erreurs.

---

## 1. 📍 Liste des Endpoints

Tous les chemins sont préfixés par `/api/v1/auth`.

| Méthode | Chemin | Description | Authentification Requise |
|---|---|---|---|
| **POST** | `/api/v1/auth/login` | Connecte un utilisateur et génère un jeton | ❌ Non |
| **POST** | `/api/v1/auth/logout` | Invalide la session en cours | ⚠️ Oui |
| **GET** | `/api/v1/auth/me` | Récupère le profil de l'utilisateur connecté | ⚠️ Oui |

---

## 2. 🔐 Connexion de l'utilisateur (`POST /login`)

Permet à un utilisateur de s'authentifier au sein d'un tenant (entreprise) spécifique.

### 📥 Corps de la requête (Request Body) :
- `Content-Type`: `application/json`

```json
{
  "email": "hr@quebec-inc.com",
  "password": "password123",
  "tenantId": "quebec-inc"
}
```

> [!NOTE]
> `tenantId` peut être soit l'**UUID** unique du tenant dans la base de données, soit son **slug** unique (code entreprise textuel comme `quebec-inc`).

### 📤 Réponse en cas de succès (`200 OK`) :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "email": "hr@quebec-inc.com",
    "firstName": "Sophie",
    "lastName": "Gagnon",
    "role": "HR_ADMIN",
    "tenantId": "8f8e8d8c-8b8a-8f8e-8d8c-8b8a8f8e8d8c"
  }
}
```

### ❌ Réponses d'erreur fréquentes :
- **`400 Bad Request`** : Format de requête invalide (ex: email incorrect, champs requis manquants).
- **`401 Unauthorized`** : 
  - Identifiants invalides (email ou mot de passe incorrect).
  - Identifiants d'entreprise (tenant) inexistants ou inactifs.
  - Serveur d'authentification SSO (Keycloak) hors-ligne (si configuré).

---

## 3. 👤 Profil Utilisateur Connecté (`GET /me`)

Permet de récupérer à tout moment les détails de session de l'utilisateur connecté à partir du jeton fourni.

### 📥 En-têtes requis (Headers) :
```http
Authorization: Bearer <votre_token_jwt>
x-tenant-id: 8f8e8d8c-8b8a-8f8e-8d8c-8b8a8f8e8d8c
```

### 📤 Réponse en cas de succès (`200 OK`) :
```json
{
  "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "email": "hr@quebec-inc.com",
  "firstName": "Sophie",
  "lastName": "Gagnon",
  "role": "HR_ADMIN",
  "tenantId": "8f8e8d8c-8b8a-8f8e-8d8c-8b8a8f8e8d8c",
  "employee": {
    "id": "e1d2c3b4-a5f6-7e8d-9c0b-1a2b3c4d5e6f",
    "employeeNumber": "EMP-2026-001",
    "status": "ACTIVE",
    "department": "Ressources Humaines"
  }
}
```

---

## 4. 🚪 Déconnexion (`POST /logout`)

Permet d'invalider le jeton et de clore proprement la session.

### 📥 En-têtes requis (Headers) :
```http
Authorization: Bearer <votre_token_jwt>
```

### 📤 Réponse en cas de succès (`200 OK`) :
```json
{
  "success": true,
  "message": "Session fermée avec succès"
}
```
