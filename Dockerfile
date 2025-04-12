FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install -- force

COPY . .

RUN npm install -g @nestjs/cli --force

RUN echo "Running build..." && npm run build --verbose

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main"]
