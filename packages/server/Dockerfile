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
RUN bun run build

FROM oven/bun:1.3.5-slim AS runner
ARG NODE_ENV VERSION LOG_LEVEL HTTP_PORT SSH_PORT SOCKET_DIR
ENV NODE_ENV=$NODE_ENV VERSION=$VERSION LOG_LEVEL=$LOG_LEVEL HTTP_PORT=$HTTP_PORT SSH_PORT=$SSH_PORT SOCKET_DIR=$SOCKET_DIR
RUN mkdir -p /home/bun/.ssh && chown -R bun:bun /home/bun
WORKDIR /app
COPY --from=builder /workspace/packages/server/.build/server ./
RUN chmod +x ./server && chown bun:bun ./server
USER bun
EXPOSE $HTTP_PORT
EXPOSE $SSH_PORT
ENTRYPOINT ["./server"]
LABEL org.opencontainers.image.source="https://github.com/raine-works/hukt"