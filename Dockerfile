FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps
# RUN npm install -g @nestjs/cli
# RUN npm install @types/node --save-dev

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
