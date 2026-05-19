# 🎨 Guide UI/UX — Authentification (Auth)

Ce document décrit les choix graphiques, l'ergonomie, les micro-animations et la structure de l'interface utilisateur (UI) dédiée à la connexion au SIRH.

---

## 1. 📐 Design de la Page de Connexion (`LoginPage.tsx`)

La page de connexion a été conçue pour offrir un effet **Premium et State-Of-The-Art** immédiat.

### 💎 Caractéristiques Visuelles Principales :
- **Mise en page Split-Screen** (Sur grands écrans) :
  - **Côté Gauche (Formulaire)** : Centré, très épuré, fond sombre uni Catppuccin (`--base`) ou clair Catppuccin (`--base` clair). Un grand soin est apporté au contraste et à l'accessibilité.
  - **Côté Droit (Image de Marque / Ambiance)** : Un dégradé vibrant avec effet de verre dépoli (**Glassmorphism**) affichant le slogan de l'application et des illustrations d'entreprise générées dynamiquement.
- **Formulaire de saisie** :
  - **Logo HRMS** épuré en haut avec typographie moderne Google Font **Outfit**.
  - **Inputs fluides** : Effet de focus avec lueur externe colorée Indigo (`--primary-subtle`) et changement de bordure.
  - **Bouton d'action principal** : Large, avec micro-animation au survol (translation légère vers le haut + amplification du halo lumineux de fond).

---

## 2. 🌗 Gestion des Thèmes & Couleurs (Catppuccin Mocha / Latte)

La page s'adapte en temps réel aux préférences visuelles de l'utilisateur grâce à des variables CSS harmonieuses :

- **En mode Sombre (Default)** :
  - Fond de base : `#1e1e2e` (Catppuccin Mocha Base).
  - Fond de carte : `#181825` (Catppuccin Mocha Mantle).
  - Couleur de texte : `#cdd6f4` (Contraste optimal).
  - Lueur active : `rgba(99, 102, 241, 0.3)` (Violet/Indigo électrique).
- **En mode Clair** :
  - Fond de base : `#eff1f5` (Catppuccin Latte Base).
  - Fond de carte : `#e6e9ef` (Catppuccin Latte Mantle).
  - Couleur de texte : `#4c4f69` (Gris foncé profond).

---

## 3. 🌐 Sélecteurs Multilingues & Widget compact

Afin de ne pas surcharger la page tout en rendant les réglages accessibles :
- **Intégration du composant `LanguageThemeToggle`** en haut à droite de la page de connexion et dans le Header principal.
- **Interaction intuitive** :
  - Les boutons de changement de langue affichent le drapeau du pays ainsi que les deux premières lettres en majuscule (FR 🇫🇷, EN 🇬🇧, ES 🇪🇸).
  - La sélection d'une langue applique une transition animée en fondu (`animate-fade-in`) sur tous les textes traduits pour éviter un rafraîchissement brutal de l'écran.

---

## 4. ⚡ Micro-animations UX

Pour enrichir l'expérience utilisateur et guider l'attention :
- **Transition de saisie** : Les étiquettes (labels) changent subtilement de couleur au focus de l'input correspondant.
- **Shake Error Effect** (Secousse d'erreur) : En cas de mot de passe invalide, la carte de connexion effectue une secousse horizontale rapide pour signaler l'erreur de manière non verbale.
- **Bouton de chargement (Spinner)** : Lors du clic sur "Se connecter", le bouton principal se désactive, affiche un anneau de chargement rotatif (`animate-spin`) et le texte passe de "Se connecter" à "Connexion en cours...".
