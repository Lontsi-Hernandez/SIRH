# 🧪 Stratégie de Tests — Authentification (Auth)

Ce document décrit l'approche, les outils et les scénarios de test mis en place pour garantir la sécurité et la fiabilité du module d'authentification (Auth).

---

## 1. ⚙️ Stack de Tests
- **Jest** : Framework de test principal pour le backend NestJS.
- **Supertest** : Pour les tests d'intégration et les requêtes HTTP simulées sur le serveur NestJS.
- **React Testing Library** & **Vitest** : Pour les tests de composants et du reducer Redux Toolkit côté frontend.
- **Playwright** (ou Cypress) : Pour les scénarios de bout en bout (E2E) simulant un utilisateur réel se connectant à la plateforme.

---

## 2. 📝 Scénarios de Tests Unitaires (Backend)

Les tests unitaires dans `auth.service.spec.ts` se concentrent sur la logique métier pure du `AuthService`. Ils couvrent les cas suivants :

### 🟢 Scénarios Passants (Success Cases) :
1. **Connexion réussie avec JWT Local** :
   - L'utilisateur existe, le mot de passe est correct, le tenant est actif et trouvé, le serveur Keycloak n'est pas configuré.
   - *Résultat attendu* : Retourne un `accessToken` valide généré localement et l'objet `user` complet.
2. **Connexion réussie via Keycloak SSO** :
   - L'URL Keycloak est définie, l'authentification externe réussit.
   - *Résultat attendu* : Retourne le token fourni par Keycloak et lie l'utilisateur à sa fiche locale.

### 🔴 Scénarios d'Échec (Failure Cases) :
1. **Tenant Inexistant ou Inactif** :
   - Saisie d'un `tenantId` inconnu ou désactivé.
   - *Résultat attendu* : Lève une exception `401 Unauthorized` avec le message *"Identifiants d'entreprise invalides"*.
2. **Compte Utilisateur Inexistant ou Désactivé** :
   - L'entreprise est correcte mais l'email n'existe pas ou le compte `isActive` est à `false`.
   - *Résultat attendu* : Lève une exception `401 Unauthorized` (*"Identifiants invalides ou compte inactif"*).
3. **SSO Keycloak indisponible en production** :
   - En production, sans variable de bypass, Keycloak renvoie une erreur de réseau ou une URL invalide.
   - *Résultat attendu* : Lève une exception `401 Unauthorized` (*"Serveur d'authentification SSO indisponible"*).

---

## 3. 🧪 Exemple de Test d'Intégration (Jest + NestJS)

Voici à quoi ressemble un test d'intégration pour valider la réponse HTTP globale :

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('AuthModule (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /api/v1/auth/login - Échec si mot de passe vide', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'hr@quebec-inc.com',
        password: '',
        tenantId: 'quebec-inc'
      })
      .expect(400); // Validation du DTO
  });

  afterAll(async () => {
    await app.close();
  });
});
```
