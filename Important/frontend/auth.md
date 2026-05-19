# FEATURE: AUTHENTIFICATION FRONTEND (EXECUTION MODE)

## OBJECTIF FINAL
Implémenter un système complet d’authentification Keycloak avec :
- login
- logout
- refresh token
- protection routes
- gestion multi-tenant
- état global Redux
- UX premium

---

# 1. CONTRAT NON NÉGOCIABLE

## SOURCE OF TRUTH AUTH
- Keycloak est UNIQUE source d’auth
- aucune auth locale custom
- aucun password stocké
- aucun user local auth system

---

# 2. ARCHITECTURE FRONTEND OBLIGATOIRE


src/
├── features/auth/
│ ├── api/
│ ├── components/
│ ├── pages/
│ ├── hooks/
│ ├── store/
│ ├── services/
│ ├── guards/
│ ├── types/


---

# 3. REDUX STATE (STRICT)

## authSlice

```ts
AuthState {
  user: {
    id: string
    email: string
    roles: string[]
    tenantId: string
  } | null

  accessToken: string | null
  refreshToken: string | null

  isAuthenticated: boolean

  status: "INIT" | "AUTHENTICATING" | "AUTHENTICATED" | "ERROR"
}