# ---- Stage 1: Build ----
FROM node:20-slim AS builder

WORKDIR /app

# Copy root-level files needed for the "clinka": "file:.." dependency
COPY package*.json ./
COPY frontend ./frontend

WORKDIR /app/frontend
RUN npm install

RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-slim

WORKDIR /app/frontend
ENV NODE_ENV=production

COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start"]