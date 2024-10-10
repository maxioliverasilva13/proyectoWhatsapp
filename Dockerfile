FROM node:20.14.0-bullseye

ENV APP_PORT 3000
ENV NODE_ENV prod
ENV WORKDIR_APP /var/prod

WORKDIR ${WORKDIR_APP}
COPY package.json .
RUN npm install
COPY . .

RUN npm run build

EXPOSE ${APP_PORT}

CMD ["bash", "run.sh"]