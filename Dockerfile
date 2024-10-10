FROM node:20.16.0

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -g @nestjs/cli
RUN npm install -g @types/node


COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
