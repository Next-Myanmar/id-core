FROM node:20.17-alpine3.19 AS development

WORKDIR /usr/src/app

ENV TZ=UTC

ENV NOD_ENV=dev

RUN npm install -g @nestjs/cli

RUN npm install -g pnpm

RUN pnpm config set global-bin-dir /usr/local/bin

RUN pnpm install -g pnpm

COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY tsconfig.build.json tsconfig.build.json
COPY nest-cli.json nest-cli.json

COPY libs libs
COPY i18n i18n
COPY protos/auth-users.proto protos/auth-users.proto
COPY protos/users-oauth.proto protos/users-oauth.proto

COPY apps/users/prisma apps/users/prisma
COPY apps/users/src apps/users/src
COPY apps/users/package.json apps/users/package.json
COPY apps/users/tsconfig.app.json apps/users/tsconfig.app.json

RUN pnpm install -r

WORKDIR /usr/src/app/apps/users

RUN npx prisma generate

WORKDIR /usr/src/app
