FROM node:lts-alpine AS builder

RUN npm install -g pnpm
WORKDIR /opt/app
COPY pnpm-lock.yaml ./
RUN pnpm fetch

# ----------

COPY . .
# For pnpm, this is just hardlinking a bunch of directories, so it's basically free.
RUN pnpm install --offline
RUN NODE_ENV=production pnpm build
RUN pnpm prune --prod

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
