FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS dev
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/config/package.json ./packages/config/package.json
RUN pnpm install
CMD ["pnpm", "--filter", "@arena/api", "start:dev"]

FROM base AS build
COPY . .
RUN pnpm install && pnpm --filter @arena/shared build && pnpm --filter @arena/api build

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/package.json ./package.json
COPY --from=build /workspace/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
