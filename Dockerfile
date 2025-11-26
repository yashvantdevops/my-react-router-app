FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

# Production image
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY server.mjs .

EXPOSE 3000

CMD ["npm", "start"]
