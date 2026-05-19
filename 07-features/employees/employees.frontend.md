# ⚛️ Architecture Frontend — Gestion des Employés (Employees)

Ce document détaille l'organisation, les vues, la gestion d'état et les composants du module Employees côté client (React).

---

## 1. 📂 Structure du Répertoire Modulaire

Pour conserver un code propre et facilement maintenable, toutes les ressources du module Employees sont centralisées sous un dossier de fonctionnalités dédié :

```text
src/features/employees/
 ├── api/            # Appels API Axios (queries, mutations)
 ├── pages/          # Pages principales (Employee List, Profile 360°)
 ├── components/     # Boutons, widgets, éléments visuels réutilisables
 ├── modals/         # Modales de confirmation, formulaires d'ajout
 ├── forms/          # Définitions de schémas de formulaires (Formik/React Hook Form)
 ├── tables/         # Tableaux virtualisés avancés et gestion des colonnes
 ├── timeline/       # Composants interactifs de la ligne de vie collaborateur
 ├── analytics/      # Graphiques, KPIs et widgets statistiques
 ├── store/          # Redux Slice (state, actions, selectors)
 └── hooks/          # Custom hooks React pour la logique réutilisable
```

---

## 2. 🖥️ Pages & Écrans Principaux

### 👥 Liste des Employés (`/employees`)
L'écran central pour rechercher et filtrer les effectifs de l'entreprise.
*   **Fonctionnalités avancées** :
    *   **Tableau virtualisé** (`virtualized table`) : Rendu performant de milliers de lignes en limitant le DOM HTML actif.
    *   **Filtres avancés** : Filtrage croisé par département, poste, statut (Actif, Suspendu, etc.) et date d'embauche.
    *   **Recherche rapide** : Recherche instantanée par nom, prénom ou numéro d'employé.
    *   **Actions groupées** (`bulk actions`) : Export groupé, archivage en lot, changement de statut groupé.
    *   **Exports ouverts** : Téléchargement direct en CSV, XLSX, JSON, PDF.
    *   **Tri intelligent** : Tri rapide sur toutes les colonnes clés.

### 👤 Profil 360° de l'Employé (`/employees/:id`)
Une vue immersive centralisant l'intégralité du dossier du collaborateur répartie en onglets contextuels :
1.  **Profil** : Informations personnelles, contact, coordonnées bancaires, photo.
2.  **Documents** : Contrats de travail, pièces d'identité, attestations d'assurance, diplômes.
3.  **Paie** : Salaire horaire/annuel, historique des fiches de paie, avantages sociaux.
4.  **Congés** : Solde de congés (annuels, maladie), historique des demandes.
5.  **Ligne de vie (Timeline)** : Historique chronologique des événements professionnels.
6.  **Performance** : Résultats des entretiens annuels, objectifs fixés.
7.  **Notes** : Commentaires administratifs sécurisés (RH/CEO).
8.  **Habilitations & Permissions** : Rôle dans le SIRH, droits d'accès.

---

## 3. 🛡️ Règles UX & Standards d'Ergonomie

Pour offrir une expérience de classe mondiale, l'implémentation doit respecter scrupuleusement ces 4 règles UX :

> [!IMPORTANT]
> **Règle 1 — Pas de formulaires surchargés (No Overloaded Forms)**
> Un formulaire ne doit jamais effrayer l'utilisateur. Diviser les formulaires complexes en étapes logiques faciles à remplir.

> [!TIP]
> **Règle 2 — Divulgation Progressive (Progressive Disclosure)**
> Afficher l'information uniquement au moment où elle est nécessaire. Masquer les champs optionnels ou avancés sous des sections extensibles.

> [!NOTE]
> **Règle 3 — Sauvegarde automatique des brouillons (Auto-save Draft Forms)**
> Tout formulaire de création/modification d'employé doit sauvegarder automatiquement les saisies localement pour éviter les pertes accidentelles si l'utilisateur change de page.

> [!IMPORTANT]
> **Règle 4 — Chargement par squelettes (Skeleton Loading)**
> Ne jamais utiliser d'indicateurs de chargement globaux bloquants. Remplacer les données en attente par des conteneurs de squelette s'animant en pulsation douce (`animate-pulse-glow`) pour une impression de vitesse accrue.

---

## 4. 🧩 Composants UI Dédiés

- **`EmployeeCard`** : Carte visuelle compacte affichant l'avatar, le nom, le poste, le département et le badge de statut (couleur sémantique).
- **`EmployeeTimeline`** : Ligne chronologique verticale stylisée affichant les icônes d'événements (calendrier pour l'embauche, valise pour la promotion, etc.) avec dates et notes explicatives.
- **`DynamicEmployeeForm`** : Formulaire généré dynamiquement à partir d'un schéma JSON de métadonnées, prenant en charge les champs personnalisés créés par les administrateurs.

---

## 5. 🗂️ État Global Redux (`employeesSlice.ts`)

```typescript
interface EmployeesState {
  employees: Employee[];                 // Liste complète des employés chargée
  selectedEmployee: Employee | null;     // Employé actuellement consulté sur sa fiche 360°
  filters: EmployeeFilters;              // Paramètres de filtres actifs (recherche, statut, dép)
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
  };
  loading: boolean;                      // État de chargement global pour le squelette
  error: string | null;                  // Message d'erreur éventuel
}
```
