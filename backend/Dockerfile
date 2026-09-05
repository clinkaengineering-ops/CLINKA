# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm ci

COPY . .

# Runs: prisma generate && tsc
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads

RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

COPY package*.json ./
# --ignore-scripts: skip postinstall's `prisma generate` here —
# we already generated the client in the builder stage and copy it below
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 5000

CMD ["npm", "run", "start:prod"]