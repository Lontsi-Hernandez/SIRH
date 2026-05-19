# 📊 Statut & Avancement du Module — Authentification (Auth)

Ce document dresse l'état des lieux, la feuille de route (roadmap) et les tâches restantes pour le module d'authentification du SIRH.

---

## 1. ✅ Tâches Réalisées (Completed)

Le cœur du module d'authentification est pleinement opérationnel en local comme en production (dans le cloud) :

- **Isolation Multi-Tenant** :
  - [x] Résolution dynamique des tenants à partir d'un Slug (ex: `quebec-inc`) ou d'un UUID PostgreSQL.
  - [x] Injection automatique de `x-tenant-id` dans les headers de requêtes sortantes frontend.
  - [x] Cloisonnement strict des données backend via un middleware dédié.
- **SSO & Résilience** :
  - [x] Connexion possible avec un serveur d'identité fédéré **Keycloak**.
  - [x] Implémentation d'un **système de repli (fallback) intelligent** en cas d'absence de Keycloak.
  - [x] Ajout de variables de contrôle comme `DB_SYNCHRONIZE` et `BYPASS_KEYCLOAK` pour faciliter les environnements de test cloud (Render + Neon).
- **Interface Utilisateur (UI/UX)** :
  - [x] Page de connexion moderne, épurée et entièrement responsive (`LoginPage.tsx`).
  - [x] Prise en charge globale et dynamique des thèmes **Clair / Sombre**.
  - [x] Internationalisation complète de l'interface en 3 langues : **Français 🇫🇷**, **Anglais 🇬🇧**, et **Espagnol 🇪🇸**.

---

## 2. ⏳ Tâches Restantes & Backlog (To-Do)

Voici les améliorations planifiées pour les prochaines itérations :

- [ ] **Sécurité Avancée** :
  - [ ] Implémenter un mécanisme de limitation de débit (Rate Limiting / Throttle) sur `/api/v1/auth/login` pour limiter les attaques par force brute.
  - [ ] Blacklister en base Redis/Mémoire les jetons révoqués lors d'un `POST /logout`.
- [ ] **Fonctionnalités Utilisateur** :
  - [ ] Permettre la récupération de mot de passe oublié par email (Intégration d'un service de mailer comme Nodemailer).
  - [ ] Ajouter une case à cocher "Se souvenir de moi" prolongeant le token de session.
- [ ] **Qualité de code** :
  - [ ] Écrire les tests unitaires frontend pour le composant `LanguageThemeToggle` et le reducer Redux.

---

## 3. 📈 Tableau de Bord d'Avancement Global

| Fonctionnalité | Complexité | Statut | Risques identifiés |
|---|---|---|---|
| Résolution Multi-Tenant | Moyenne | 🟢 Prêt | Aucun |
| Authentification Keycloak | Élevée | 🟡 Prêt (avec bypass) | Dépendance externe |
| Fallback JWT Local | Faible | 🟢 Prêt | Aucun |
| Interface LoginPage | Faible | 🟢 Prêt | Aucun |
| Thèmes & Langues (i18n) | Moyenne | 🟢 Prêt | Aucun |
| Système anti force-brute | Moyenne | 🔴 À faire | Surcharge de connexions légitimes |
