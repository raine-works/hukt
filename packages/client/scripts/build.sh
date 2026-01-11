#!/bin/bash

VERSION=$(jq -r .version package.json)
GITHUB_USERNAME="raine-works"
PROJECT_NAME="hukt"
PACKAGE_NAME="client"

cd ../../

if docker buildx ls | grep -q docker-container; then
    echo "Using existing builder."
else
    docker buildx create --name container --driver=docker-container
fi

docker buildx build \
    -f packages/${PACKAGE_NAME}/Dockerfile \
    --platform linux/amd64,linux/arm64 \
    -t ghcr.io/${GITHUB_USERNAME}/${PROJECT_NAME}/${PACKAGE_NAME}:latest \
    -t ghcr.io/${GITHUB_USERNAME}/${PROJECT_NAME}/${PACKAGE_NAME}:${VERSION} \
    --build-arg=NODE_ENV=production \
    --build-arg=VERSION=${VERSION} \
    --build-arg=LOG_LEVEL=info \
    --builder=container \
    --push \
    .