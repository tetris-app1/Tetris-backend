# ---------- Build Stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# ---------- Runtime Stage ----------
FROM node:18-alpine

WORKDIR /app

# copy only runtime deps
COPY --from=builder /app .

EXPOSE 4000

ENV REDIS_HOST=redis.default.svc.cluster.local

CMD ["node","server.js"]
