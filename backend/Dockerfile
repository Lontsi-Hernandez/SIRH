# ─── Étape 1: Développement ───────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# ─── Étape 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Installer toutes les dépendances (y compris les devDependencies) pour pouvoir compiler le TypeScript
RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY . .
RUN npm run build

# Nettoyer les dépendances de développement après la compilation pour optimiser l'image finale
RUN npm prune --production

# ─── Étape 3: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main"]
