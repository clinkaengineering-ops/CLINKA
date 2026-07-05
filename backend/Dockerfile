# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Runs: prisma generate && tsc
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Compiled JS output
COPY --from=builder /app/dist ./dist

# Prisma schema + migrations (needed for `prisma migrate deploy` at runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Generated Prisma client — copy both the compiled JS (in dist) and any
# non-compiled runtime assets Prisma emits alongside it (engine files, etc.)
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 5000

CMD ["npm", "run", "start:prod"]