FROM node:lts-alpine AS deps

WORKDIR /opt/app
COPY package.json yarn.lock ./
RUN yarn config set no-progress && \
    yarn --frozen-lockfile

# ----------

FROM node:lts-alpine AS builder

WORKDIR /opt/app
ENV NODE_ENV=production
COPY . .
COPY --from=deps /opt/app/node_modules ./node_modules
RUN yarn build

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
