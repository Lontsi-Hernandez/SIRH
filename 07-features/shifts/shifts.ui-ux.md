# 🎨 Spécifications UI/UX & Design — Gestion des Horaires & Présences (Shifts)

Ce document décrit les principes ergonomiques, la charte visuelle, l'internationalisation (i18n), l'accessibilité WCAG et l'expérience utilisateur (UX) pour le module Shifts.

---

## 1. 🖼️ Principes d'Ergonomie de la Grille de Planification

Pour simplifier le travail des gestionnaires de plannings, l'interface utilisateur s'appuie sur une grille de calendrier interactive haut de gamme :

### A. La Grille Hebdomadaire Drag & Drop
*   **Axe horizontal** : Jours de la semaine (Lundi au Dimanche).
*   **Axe vertical** : Liste des employés du département sélectionné.
*   **Interaction Drag & Drop** :
    *   Le manager peut saisir une carte de shift et la faire glisser pour changer le jour ou la réassigner à un autre employé de la liste.
    *   *Micro-animation* : Pendant le déplacement, la carte d'origine reste en opacité `40%` et l'emplacement potentiel sous le curseur s'illumine d'une légère bordure pointillée verte.
*   **Conflits visuels** : Si une carte est glissée sur une plage horaire déjà occupée par un congé ou un autre shift de l'employé, l'emplacement cible vire au rouge vif avec une animation de secousse (*shake*) et le drop est bloqué.

---

## 2. 🕒 Le Widget Mobile de Pointage (ClockWidget)

Pour les collaborateurs travaillant sur le terrain, le pointage s'effectue via un widget centralisé sur le tableau de bord mobile :

```
┌─────────────────────────────────────────┐
│              POINTAGE REQUIS            │
│  🕒 Quart actuel : 08:00 - 16:00        │
│                                         │
│          ┌───────────────────┐          │
│          │     🟢 PRÉSENT    │          │
│          │  (Dans la zone)   │          │
│          └───────────────────┘          │
│                                         │
│                 ( 🔘 )                  │
│             POINTER L'ENTRÉE            │
│            [Pulsation Verte]            │
└─────────────────────────────────────────┘
```

*   **Indicateur de Zone** :
    *   *Vert (Dans la zone)* : L'employé est détecté à moins de 200m. Le bouton principal s'anime d'une pulsation douce verte (`#a6e3a1`) et l'accès est autorisé.
    *   *Rouge (Hors zone)* : L'employé est trop éloigné. Le bouton est désactivé et un message d'aide affiche la distance à parcourir.
*   **Action interactive** : Appui long de **1.5 seconde** pour pointer (évite les déclenchements accidentels), accompagné d'un retour haptique sur mobile.

---

## 3. 🌐 Traduction & Localisation i18n

Le module prend en charge de manière fluide le **Français**, l'**Anglais** et l'**Espagnol**.

### Clés i18n nécessaires (`frontend/src/i18n/locales/*.json`) :
```json
{
  "shifts": {
    "title": "Gestion des Horaires",
    "planned": "Planifié",
    "active": "En cours",
    "completed": "Complété",
    "late": "En retard",
    "absent": "Absent",
    "overtime": "Heures Supplémentaires",
    "clockIn": "Pointer l'Entrée",
    "clockOut": "Pointer la Sortie",
    "geoError": "Vous devez être sur le lieu de travail pour pointer.",
    "conflictError": "Cet employé a déjà un quart planifié sur cette période."
  }
}
```

---

## ♿ 4. Accessibilité WCAG & Clavier

1.  **Navigation Clavier** :
    *   La touche `Tab` permet de naviguer de manière ordonnée à travers chaque carte de shift de la grille.
    *   Un contour contrasté visible (outline `#89b4fa`, `3px`) entoure l'élément actif.
    *   La touche `Entrée` ou `Espace` sur une carte de shift ouvre instantanément la boîte de dialogue de détails/édition.
2.  **Lecteurs d'écran (Aria-Labels)** :
    *   Chaque carte de shift porte un attribut descriptif précis, ex : `aria-label="Shift de Jean Tremblay, 24 Mai de 08:00 à 16:00, Statut Planifié"`.
