# Fase 1: Construcción
FROM node:18 AS build

WORKDIR /app

# Copiamos los archivos necesarios para instalar las dependencias
COPY package*.json ./

# Instalamos todas las dependencias
RUN npm install --legacy-peer-deps

# Copiamos el resto de la aplicación
COPY . .

# Construimos la aplicación NestJS
RUN npm run build

# Fase 2: Producción
FROM node:18 AS production

WORKDIR /app

COPY --from=build /app/dist ./dist

COPY --from=build /app/node_modules ./node_modules

COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
