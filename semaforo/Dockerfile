# Build standalone do Next — o modo pensado para auto-hospedagem (seção 14.2).
# Gera uma imagem pequena, sem node_modules completo.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# domínios públicos extras (além de *.vercel.app) que podem disparar Server
# Actions; entra no build porque o next.config é congelado nele
ARG DOMINIOS_PUBLICOS=""
ENV DOMINIOS_PUBLICOS=$DOMINIOS_PUBLICOS
RUN npm run build

# As migrations rodam a partir desta imagem, que tem o drizzle-kit
# (`docker compose run --rm migrador`). A imagem de execução não tem.
FROM build AS migrador
CMD ["npx", "drizzle-kit", "migrate"]

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# não rodar como root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
