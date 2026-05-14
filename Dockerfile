# ── Base Alpine (runner e migrator) ───────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ── Base Debian (build stages — evita SIGILL com SWC/Turbopack em CPUs sem AVX2)
FROM node:20-slim AS build-base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# ── Dependências (Debian para compatibilidade com binários SWC) ───────────────
FROM build-base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Migrator (aplica migrações com node_modules completo) ────────────────────
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
RUN node_modules/.bin/prisma generate
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# ── Build ─────────────────────────────────────────────────────────────────────
FROM build-base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npx prisma generate
RUN npm run build

# ── Runner (imagem final, apenas o necessário para rodar) ────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia o runtime Prisma gerado para Alpine (linux-musl-openssl-3.0.x)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma  ./node_modules/@prisma

COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
