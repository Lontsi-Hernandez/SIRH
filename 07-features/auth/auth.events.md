# 📢 Événements & Audit de Sécurité (Auth)

Ce document décrit les événements liés au cycle de vie de l'authentification et les mécanismes d'audit de sécurité mis en place pour tracer les connexions et détecter les anomalies.

---

## 1. 🛡️ Audit de Sécurité (Audit Logs)

Pour des raisons de conformité légale et de traçabilité, le backend NestJS enregistre chaque tentative de connexion au sein de la base de données ou dans les flux de logs standardisés (Stdout).

Chaque log de sécurité contient les informations suivantes :
- **Horodatage** (Date et heure précises de l'événement).
- **Type d'événement** (Tentative, Succès, Échec, Déconnexion, Blocage).
- **Identifiant de l'utilisateur** (Adresse email saisie).
- **UUID du Tenant** (Entreprise ciblée).
- **Adresse IP source** et **User-Agent** (Navigateur/Système d'exploitation de l'appelant).
- **Raison de l'échec** (ex: *Mot de passe incorrect*, *Compte inactif*, *Tenant inexistant*).

---

## 2. ⚡ Événements Émis (Event Lifecycle)

Le module d'authentification émet des événements internes (à l'aide de `@nestjs/event-emitter` ou de hooks de base de données) pour déclencher d'autres processus métier :

### 📥 `auth.login.success`
Déclenché immédiatement après une connexion réussie.
- **Actions associées** :
  - Mise à jour de la colonne `last_login` de l'utilisateur dans PostgreSQL.
  - Réinitialisation des compteurs de tentatives de connexions échouées (anti-brute force).
  - Envoi de notifications push si l'adresse IP de connexion est inhabituelle.

### ⚠️ `auth.login.failed`
Déclenché lors d'un échec de connexion (mauvais mot de passe ou email inexistant).
- **Actions associées** :
  - Incrémentation du compteur de tentatives échouées.
  - Alerte de sécurité dans les logs système si plus de 5 échecs consécutifs surviennent sur le même compte en moins de 10 minutes.
  - Blocage temporaire de l'IP en cas d'attaque par force brute suspectée.

### 🚪 `auth.logout`
Déclenché lorsqu'un utilisateur met fin manuellement à sa session.
- **Actions associées** :
  - Révocation immédiate du token JWT (si stocké dans une liste de révocation - Blacklist).
  - Enregistrement de la fin de session dans les logs d'activité.

---

## 3. 📝 Exemple de Logs d'Authentification (Stdout)

Voici un aperçu des logs générés par le service `AuthService` en cours d'exécution :

```text
[Nest] 1  - 05/19/2026, 3:40:08 AM   WARN [AuthService] ⚠️ Authentification Keycloak non configurée ou indisponible (Bypass activé).
[Nest] 1  - 05/19/2026, 3:40:09 AM   INFO [AuthService] 👤 [Audit] Connexion réussie pour hr@quebec-inc.com sur le tenant quebec-inc (UUID: 8f8e8d8c...) - IP: 192.168.1.50
[Nest] 1  - 05/19/2026, 3:42:15 AM   WARN [AuthService] 👤 [Audit] ÉCHEC de connexion pour ceo@quebec-inc.com sur le tenant quebec-inc - Raison: Mot de passe incorrect - IP: 192.168.1.52
[Nest] 1  - 05/19/2026, 3:45:00 AM   ERROR [AuthService] ❌ Tentative de connexion bloquée pour un tenant inactif : test-tenant (UUID: 1234...)
```
