FROM node:18 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --no-cache --legacy-peer-deps --maxsockets=1

COPY . .

RUN npm run build

FROM node:18 AS production

WORKDIR /app

COPY --from=build /app/dist ./dist

COPY --from=build /app/node_modules ./node_modules

COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
