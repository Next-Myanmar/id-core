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
COPY protos/auth-users.proto protos/auth-users.proto

COPY apps/users/prisma apps/users/prisma
COPY apps/users/src apps/users/src
COPY apps/users/package*.json apps/users/
COPY apps/users/tsconfig*.json apps/users/
COPY apps/users/.env apps/users/.env

RUN pnpm install -r

WORKDIR /usr/src/app/apps/users

RUN npx prisma generate

WORKDIR /usr/src/app
