FROM oven/bun:1.3.5 AS base 
FROM base AS pruner

WORKDIR /workspace
COPY ./ ./
RUN bunx turbo prune --scope=@hukt/client --docker

FROM base AS builder
WORKDIR /workspace

COPY --from=pruner /workspace/out/json/ ./
RUN bun install --frozen-lockfile

COPY --from=pruner /workspace/out/full/ ./
RUN bun run build

FROM alpine AS runner
ARG NODE_ENV VERSION LOG_LEVEL
ENV NODE_ENV=$NODE_ENV VERSION=$VERSION LOG_LEVEL=$LOG_LEVEL
LABEL org.opencontainers.image.source="https://github.com/raine-works/hukt"
WORKDIR /app
COPY --from=builder /workspace/packages/client/.build/client ./
ENTRYPOINT ["./client"]