FROM node:20.17-alpine3.19 as development

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
COPY protos/auth-oauth.proto protos/auth-oauth.proto

COPY apps/auth/prisma apps/auth/prisma
COPY apps/auth/src apps/auth/src
COPY apps/auth/package.json apps/auth/package.json
COPY apps/auth/tsconfig.app.json apps/auth/tsconfig.app.json

RUN pnpm install -r

WORKDIR /usr/src/app/apps/auth

RUN npx prisma generate

WORKDIR /usr/src/app