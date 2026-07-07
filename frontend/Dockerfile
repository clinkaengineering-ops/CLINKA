# ---- Stage 1: Build ----
FROM node:20-slim AS builder

WORKDIR /app/frontend

# Minimal stand-in for the repo-root package.json, just to satisfy
# the "clinka": "file:.." dependency resolution — it has no real code.
RUN mkdir -p /app && printf '{"name":"clinka","private":true}' > /app/package.json

COPY . .
RUN npm install
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-slim

WORKDIR /app/frontend
ENV NODE_ENV=production

RUN mkdir -p /app && printf '{"name":"clinka","private":true}' > /app/package.json

COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start"]