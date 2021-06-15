FROM node:lts-alpine AS builder

RUN npm install -g pnpm
WORKDIR /opt/app
ENV NODE_ENV=production
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod

# ----------

COPY . .
RUN pnpm build --offline --prod

# ----------

FROM node:lts-alpine AS runner

LABEL org.opencontainers.image.source https://github.com/redbadger/badger-brian

WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=builder /opt/app/package.json ./
COPY --from=builder /opt/app/dist ./dist
COPY --from=builder /opt/app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/index.js"]
