# FROM node:18

# WORKDIR /app

# COPY package*.json ./
# RUN npm install --legacy-peer-deps
# RUN npm install -g @nestjs/cli
# RUN npm install

# COPY . .

# RUN npm run build

# EXPOSE 3000

# CMD ["npm", "run", "start:dev"]

# Fase 1: Construcción
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps --only=production

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:18 AS production

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules

COPY --from=build /app/dist ./dist

COPY package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
