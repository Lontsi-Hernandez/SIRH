# ⚛️ Spécifications du Frontend React — Gestion des Horaires & Présences (Shifts)

Ce document détaille l'implémentation de l'interface utilisateur, des composants graphiques et de la gestion de l'état global avec Redux Toolkit (RTK) pour le module Shifts.

---

## 1. 📂 Organisation des Composants Frontend

L'architecture du module Shifts sur le frontend React est localisée sous `frontend/src/` :

```
frontend/src/
├── pages/
│   └── shifts/
│       ├── ShiftsPage.tsx          # Vue d'ensemble (Plannings + Actions)
│       └── components/
│           ├── ShiftsCalendar.tsx  # Grille calendrier Drag & Drop
│           ├── ClockWidget.tsx     # Widget interactif de pointage
│           └── ShiftModal.tsx      # Création/édition d'un quart
├── store/
│   └── slices/
│       └── shiftSlice.ts           # Tranche Redux Toolkit (State Management)
```

---

## 2. 🎛️ Gestion d'État Redux Toolkit (`shiftSlice.ts`)

La tranche Redux gère la planification, les pointages réels, et les états de transition asynchrones.

```typescript
interface ShiftState {
  items: Shift[];
  timeEntries: TimeEntry[];
  currentActiveEntry: TimeEntry | null;
  loading: boolean;
  error: string | null;
  filters: {
    startDate: string;
    endDate: string;
    employeeId: string | null;
  };
}

const initialState: ShiftState = {
  items: [],
  timeEntries: [],
  currentActiveEntry: null,
  loading: false,
  error: null,
  filters: {
    startDate: new Date().toISOString(), // Début de semaine
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Fin de semaine
    employeeId: null,
  },
};
```

**Thunks Asynchrones Clés** :
*   `fetchShifts(filters)` : Récupère la liste des plannings pour la période.
*   `updateShiftDates({ id, startTime, endTime })` : Déclenché instantanément lors du lâcher (Drop) d'un shift dans le calendrier.
*   `clockInEmployee(location)` : Déclenche l'action de pointage d'arrivée avec les coordonnées géographiques et met à jour le statut global.
*   `clockOutEmployee(location)` : Déclenche le pointage de départ.

---

## 3. 🎨 Design Premium & Thématique Catppuccin

L'interface du planificateur doit éblouir l'utilisateur au premier coup d'œil par sa fluidité et son esthétique haut de gamme :

### A. Thème Catppuccin Mocha & Latte
*   **Fond principal** : Base (`#1e1e2e` en sombre / `#eff1f5` en clair).
*   **Fond des cartes de shifts** : Surface0 (`#313244` / `#ccd0da`) avec des bordures accentuées de couleurs douces :
    *   *Shift Standard* : Bordure bleue (`#89b4fa`).
    *   *Shift Heures Supp (Overtime)* : Bordure jaune (`#f9e2af`).
    *   *Pointage en retard (Late)* : Bordure rouge (`#f38ba8`).

### B. Micro-Animations & Réactivité
*   **Hover sur les Shifts** : Légère translation vers le haut de `2px` et ombrage doux avec une transition CSS fluide de `200ms` :
    ```css
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    ```
*   **Glissement Drag & Drop** : Animation de drop fluide avec retour visuel d'ombre portée pour indiquer l'emplacement d'accueil valide.
*   **Widget Pointage (ClockWidget)** : Effet de pulsation circulaire sur le bouton "Pointer" quand l'employé est dans la zone géographique autorisée (indicateur vert de confiance).

### C. Squelette de Chargement Pulsation
Pendant le chargement des plannings hebdomadaires, une grille de squelettes animés en fondu pulsatoire simule la structure du calendrier :
```css
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.skeleton-shift-card {
  animation: pulse 1.5s infinite ease-in-out;
  background-color: var(--color-surface0);
  border-radius: 6px;
  height: 80px;
}
```
