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

COPY apps/auth/prisma apps/auth/prisma
COPY apps/auth/src apps/auth/src
COPY apps/auth/package*.json apps/auth/
COPY apps/auth/tsconfig*.json apps/auth/
COPY apps/auth/.env apps/auth/.env

RUN pnpm install -r

WORKDIR /usr/src/app/apps/auth

RUN npx prisma generate

WORKDIR /usr/src/app