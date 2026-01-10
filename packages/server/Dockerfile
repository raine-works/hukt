FROM oven/bun:1.3.5 AS base 
FROM base AS pruner

WORKDIR /workspace
COPY ./ ./
RUN bunx turbo prune --scope=@hukt/server --docker

FROM base AS builder
WORKDIR /workspace

COPY --from=pruner /workspace/out/json/ ./
RUN bun install --frozen-lockfile

COPY --from=pruner /workspace/out/full/ ./
COPY ./packages/server/.keys ./packages/server/.keys
RUN bun run build

FROM ubuntu AS runner
ARG NODE_ENV VERSION PORT
ENV NODE_ENV=$NODE_ENV VERSION=$VERSION PORT=$PORT
LABEL org.opencontainers.image.source="https://github.com/raine-works/hukt"
WORKDIR /app
COPY --from=builder /workspace/packages/server/.build/server ./
EXPOSE $PORT
ENTRYPOINT ["server"]