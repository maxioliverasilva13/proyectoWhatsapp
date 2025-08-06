FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Limpiar cache y configurar npm para evitar problemas
RUN npm cache clean --force && \
    npm config set fund false && \
    npm config set audit false

# Instalar todas las dependencias (necesarias para build)
RUN npm ci --ignore-scripts || npm install --force --ignore-scripts

COPY . .

# Instalar NestJS CLI
RUN npm install -g @nestjs/cli@latest

RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Copiar package.json para instalar solo deps de producción
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copiar el build de la etapa anterior
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

ENV NODE_OPTIONS=--openssl-legacy-provider

CMD ["node", "dist/main"]
