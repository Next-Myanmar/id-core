FROM node:20.17-alpine3.19 AS development

WORKDIR /usr/src/app

ENV TZ=UTC

RUN npm install -g @nestjs/cli

RUN npm install -g pnpm

RUN pnpm config set global-bin-dir /usr/local/bin

RUN pnpm install -g pnpm

COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY libs libs
COPY i18n i18n
COPY email-templates email-templates

COPY apps/notifications/src apps/notifications/src
COPY apps/notifications/package*.json apps/notifications/
COPY apps/notifications/tsconfig*.json apps/notifications/
COPY apps/notifications/.env apps/notifications/.env

RUN pnpm install -r