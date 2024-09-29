FROM node:lts-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS start
COPY --from=prod-deps /app/node_modules /app/node/node_modules
COPY --from=build /app/dist /app/dist
EXPOSE ${SERVER_PORT}
CMD ["sh", "-c", "pnpm db:migrate && pnpm db:seed && pnpm start"]
