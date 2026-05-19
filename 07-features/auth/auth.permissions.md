# 🛡️ Autorisations & Permissions (Auth)

Ce document détaille la matrice des rôles et des permissions, ainsi que la méthode employée pour sécuriser les ressources du SIRH selon le profil de l'utilisateur.

---

## 1. 👥 Liste des Rôles Applicatifs

Le SIRH implémente un modèle RBAC (Role-Based Access Control) structuré autour de quatre rôles majeurs :

1. **`CEO` (Directeur Général / Propriétaire)** :
   - Accès complet et illimité à toutes les données de son entreprise (tenant).
   - Validation des budgets, paie globale, performances et embauches.
2. **`HR_ADMIN` (Gestionnaire des Ressources Humaines)** :
   - Gestion opérationnelle de tous les employés du tenant.
   - Validation des congés, planification des horaires, processus de recrutement, gestion des hébergements.
3. **`MANAGER` (Chef d'équipe / Superviseur)** :
   - Accès aux données de son équipe directe (subordonnés).
   - Consultation des plannings de son équipe, pré-approbation des demandes de congés.
4. **`EMPLOYEE` (Salarié standard)** :
   - Accès restreint en lecture-écriture à sa propre fiche personnelle (profil).
   - Demande de congés personnels, consultation de son planning et de ses fiches de paie.

---

## 2. 📊 Matrice des Permissions (RBAC)

Le tableau suivant montre les niveaux d'accès par module et par rôle :

| Module / Ressource | Rôle CEO | Rôle HR_ADMIN | Rôle MANAGER | Rôle EMPLOYEE |
|---|---|---|---|---|
| **Fiche Employé (Perso)** | 👁️ / ✍️ | 👁️ / ✍️ | 👁️ / ✍️ | 👁️ (Lecture seule) |
| **Tous les Employés** | 👁️ / ✍️ | 👁️ / ✍️ | 👁️ (Équipe) | ❌ Aucun |
| **Plannings & Horaires** | 👁️ / ✍️ | 👁️ / ✍️ | 👁️ / ✍️ (Équipe) | 👁️ (Perso uniquement) |
| **Congés (Validation)** | 👁️ / ✍️ | 👁️ / ✍️ | ✍️ (Pré-approbation) | ❌ Aucun |
| **Congés (Demande perso)** | ✍️ | ✍️ | ✍️ | ✍️ (Perso uniquement) |
| **Hébergements (Logements)** | 👁️ | 👁️ / ✍️ | ❌ Aucun | ❌ Aucun (Sauf attribution) |
| **Paie & Salaires** | 👁️ / ✍️ | 👁️ / ✍️ (Partiel) | ❌ Aucun | 👁️ (Fiches perso) |

*Légende : 👁️ Lecture, ✍️ Écriture/Modification, ❌ Accès Refusé.*

---

## 3. 🛡️ Implémentation Technique des Autorisations

### ⚙️ Côté Backend (NestJS Guards) :
Le `RolesGuard` extrait le rôle de l'utilisateur depuis son JWT et le compare aux rôles exigés par le décorateur `@Roles` :

```typescript
// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### ⚛️ Côté Frontend (Composants conditionnels) :
Nous affichons ou masquons les éléments de l'interface en fonction du rôle de l'utilisateur :

```tsx
import { useAppSelector } from '../../hooks/useStore';

export function HasRole({ roles, children }: { roles: string[], children: React.ReactNode }) {
  const { user } = useAppSelector((state) => state.auth);
  
  if (!user || !roles.includes(user.role)) {
    return null; // Masque le composant si le rôle ne correspond pas
  }
  
  return <>{children}</>;
}

// Exemple d'usage :
// <HasRole roles={['HR_ADMIN', 'CEO']}>
//   <button>Ajouter un employé</button>
// </HasRole>
```
