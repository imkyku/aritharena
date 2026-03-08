FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS dev
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/config/package.json ./packages/config/package.json
RUN pnpm install
CMD ["pnpm", "--filter", "@arena/web", "dev", "--host", "0.0.0.0", "--port", "5173"]

FROM base AS build
COPY . .
RUN pnpm install && pnpm --filter @arena/shared build && pnpm --filter @arena/web build

FROM nginx:1.27-alpine AS prod
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
COPY docker/nginx/web.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
