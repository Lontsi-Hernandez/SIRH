# 🔐 Architecture Frontend — Authentification (Auth)

Ce document décrit l'implémentation, l'architecture et le fonctionnement du module d'authentification (Auth) côté **Frontend (React + TypeScript)**.

---

## 1. ⚙️ Stack & Outils
L'authentification frontend repose sur les technologies suivantes :
- **React (Vite + TypeScript)** : Pour l'interface utilisateur.
- **Redux Toolkit (@reduxjs/toolkit)** : Pour la gestion globale de l'état d'authentification (`authSlice`).
- **Axios** : Client HTTP personnalisé pour communiquer avec l'API, avec gestion dynamique des headers.
- **React Router Dom (v6)** : Pour la protection des routes privées (`PrivateRoute`) et la navigation.

---

## 2. 🗂️ Structure du State (`authSlice.ts`)
L'état global de l'authentification est géré via Redux et contient les informations suivantes :

```typescript
interface AuthState {
  user: User | null;          // Infos sur l'utilisateur connecté (ID, email, nom, rôle, etc.)
  token: string | null;       // JWT d'accès actif (Keycloak ou JWT Local)
  tenantId: string | null;    // UUID du tenant (entreprise) actif résolu
  isAuthenticated: boolean;   // Flag de connexion active
  isLoading: boolean;         // Indicateur de chargement (requêtes en cours)
  error: string | null;       // Message d'erreur éventuel lors de la connexion
}
```

### ⚡ Actions principales :
- `loginStart()` : Déclenche l'indicateur de chargement.
- `loginSuccess({ user, token, tenantId })` : Stocke le jeton et les informations utilisateur en local et dans l'état global.
- `loginFailure(errorString)` : Enregistre l'erreur et arrête le chargement.
- `logout()` : Réinitialise complètement le state, nettoie le `localStorage` et redirige vers `/login`.

---

## 3. 🛡️ Protection des Routes (`PrivateRoute.tsx`)
Pour restreindre l'accès au tableau de bord et aux fonctionnalités du SIRH aux utilisateurs connectés :

```tsx
import { Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Si non authentifié, redirection vers la page de login
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
```

---

## 4. 🔀 Flux de Connexion (Login Flow)
1. **Saisie utilisateur** : L'utilisateur entre son adresse email, son mot de passe, et son **code entreprise** (Slug) ou sélectionne son entreprise.
2. **Résolution du Tenant** : L'application résout le Tenant UUID associé au code saisi en interrogeant le backend.
3. **Appel API Login** : Envoi de `POST /api/v1/auth/login` avec les identifiants et l'UUID du tenant.
4. **Enregistrement des jetons** : 
   - Le JWT d'accès est configuré comme header par défaut dans Axios (`Authorization: Bearer <token>`).
   - Le header spécial multi-tenant (`x-tenant-id`) est configuré avec l'UUID résolu.
   - Les données persistantes minimales sont écrites dans le `localStorage` pour persister la session lors d'un rafraîchissement.

---

## 5. 🛠️ Intercepteurs Axios & Sécurité
Toutes les requêtes sortantes vers l'API sont interceptées pour injecter dynamiquement le jeton de sécurité et l'identité du tenant :

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrms-token');
  const tenantId = localStorage.getItem('hrms-tenant-id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }
  
  return config;
});
```

---

## 6. 🚪 Déconnexion & Nettoyage
Lors d'une déconnexion (manuelle via l'interface ou automatique si le token expire) :
- Effacement du state Redux.
- Nettoyage complet du `localStorage` (`hrms-token`, `hrms-tenant-id`, `hrms-user`).
- Redirection propre vers `/login`.
