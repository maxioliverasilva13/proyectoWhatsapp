FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install -- force

COPY . .

RUN npm install -g @nestjs/cli --force

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist


ENV NODE_ENV=production

EXPOSE 3000

ENV NODE_OPTIONS=--openssl-legacy-provider

CMD ["node", "dist/main"]
