
---

# 📁 BACKEND
## `auth.backend.md` (VERSION EXECUTION STRICTE)

```md
# FEATURE: AUTHENTIFICATION BACKEND (EXECUTION MODE)

## OBJECTIF FINAL
Backend NestJS sécurisé avec Keycloak + multi-tenant + guards + audit + user context.

---

# 1. CONTRAT PRINCIPAL

- Keycloak = ONLY identity provider
- backend = validation + authorization only
- no password handling
- no login logic

---

# 2. ARCHITECTURE OBLIGATOIRE


auth/
├── domain/
├── application/
├── infrastructure/
│ ├── keycloak/
│ ├── repositories/
├── web/
│ ├── controllers/
│ ├── guards/
│ ├── decorators/
│ ├── middleware/


---

# 3. REQUEST PIPELINE OBLIGATOIRE

Chaque request suit :

1. JWT validation (Keycloak)
2. AuthGuard
3. TenantMiddleware
4. User injection
5. Controller

---

# 4. USER CONTEXT FINAL

```ts
Request.user = {
  id: string,
  email: string,
  roles: string[],
  tenantId: string
}