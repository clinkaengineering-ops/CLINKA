# ---- Stage 1: Build ----
FROM node:22-slim AS builder

WORKDIR /app/frontend

# Minimal stand-in for the repo-root package.json, just to satisfy
# the "clinka": "file:.." dependency resolution — it has no real code.
RUN mkdir -p /app && printf '{"name":"clinka","private":true}' > /app/package.json

COPY . .
RUN npm install
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-slim

WORKDIR /app/frontend
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy Next.js standalone output
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]