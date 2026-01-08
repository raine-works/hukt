FROM oven/bun:1.3.5 AS base 
FROM base AS pruner

WORKDIR /workspace
COPY ./ ./
RUN bunx turbo prune --scope=@hukt/server --docker

FROM base AS builder
WORKDIR /workspace

COPY --from=pruner /workspace/out/package.json ./package.json
COPY --from=pruner /workspace/out/bun.lock ./bun.lock
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/full/ ./

RUN bun install --frozen-lockfile
RUN bun run build

FROM base AS runner
ARG NODE_ENV VERSION PORT
ENV NODE_ENV=$NODE_ENV VERSION=$VERSION PORT=$PORT
WORKDIR /app
COPY --from=builder /workspace/packages/server/ ./
EXPOSE $PORT
ENTRYPOINT ["bun", "run", "src/index.ts"]