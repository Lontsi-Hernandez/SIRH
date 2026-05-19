# 🎨 Spécifications UI/UX — Gestion des Employés (Employees)

Ce document décrit les principes d'expérience utilisateur, d'accessibilité et de charte graphique appliqués au module Employees pour offrir une interface moderne et fluide.

---

## 1. 📐 Principes d'Ergonomie Fondamentaux

L'interface du module Employees est conçue pour maximiser l'efficacité opérationnelle des gestionnaires RH :

- **Recherche Instantanée & Performante** :
  - La barre de recherche réagit en temps réel avec un mécanisme de **debouncing** de 300 ms pour éviter de surcharger le réseau.
  - Le tableau utilise la virtualisation (`react-window` ou `react-virtualized`) pour ne générer dans le DOM que les lignes visibles à l'écran, maintenant un taux de rafraîchissement constant de **60 FPS** lors du défilement.
- **Saisie Allégée (No heavy forms)** :
  - Les longs formulaires sont découpés en sous-étapes claires avec indicateur de progression visuel.
  - Les champs sont dotés de validations interactives instantanées (messages d'aide explicites sous l'input, pas de popups d'erreur bloquantes).
- **Affichage Ligne de Vie (Timeline Visualization)** :
  - L'historique d'un employé est affiché de manière élégante sous forme de flux vertical. Chaque étape importante (embauche, changement de salaire, etc.) dispose d'un badge coloré et d'icônes dédiées.

---

## 🌗 Intégration du Design System & Variables CSS (Catppuccin)

L'interface s'adapte en temps réel aux modes clair et sombre via nos variables CSS :

| Élément | Mode Sombre (Mocha) | Mode Clair (Latte) | Rendu visuel attendu |
|---|---|---|---|
| **Fond de page** | `#1e1e2e` (`--base`) | `#eff1f5` (`--base`) | Confort de lecture optimal |
| **Fond des cartes** | `#181825` (`--mantle`) | `#e6e9ef` (`--mantle`) | Effet de cartes contrastées |
| **Badges de statut** | `--primary-subtle` / `--success` | `--primary-subtle` / `--success` | Contraste de couleur ajusté |
| **Lueur de Focus** | Indigo `--primary` + flou | Indigo `--primary` + flou | Clarté de focus interactive |

---

## ⚡ Micro-animations & Transitions Fluides

Pour rendre l'interface "vivante" et réactive :
- **Optimistic Updates (Mises à jour optimistes)** : Lors du changement de statut d'un employé, l'UI met à jour le badge de statut instantanément sans attendre le retour de l'API. Si l'API échoue, le statut revient en arrière avec une transition douce et affiche un toast d'erreur.
- **Fade Transitions (Fondu de page)** : Les changements d'onglets au sein du profil 360° s'effectuent via un fondu de `150ms` (`animate-fade-in`) pour adoucir le changement visuel.
- **Skeleton Pulse** : Les squelettes de chargement pulsent doucement avec l'animation `@keyframes pulse-glow` pour capter l'attention sans agresser l'œil.

---

## ♿ Accessibilité (A11y Compliance)

Conformément aux normes d'accessibilité du Web (WCAG 2.1) :
- **Contrastes de couleur** : Tous les textes (y compris les badges de statut légers) respectent un rapport de contraste minimal de **4.5:1** contre leur arrière-plan.
- **Navigation au clavier (Keyboard Navigation)** :
  - L'ensemble des tableaux et modales est navigable via la touche `Tab`.
  - Les modales se ferment à l'aide de la touche `Échap` (`Escape`) et retiennent le focus clavier à l'intérieur de leur conteneur tant qu'elles sont ouvertes.
- **Lecteurs d'écran (Screen Readers)** :
  - Tous les boutons utilisant uniquement des émojis ou icônes (ex: boutons d'export ou d'archivage) disposent d'un attribut `aria-label` descriptif lisible par les outils d'accessibilité.
