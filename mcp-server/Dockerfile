FROM node:20-alpine

# Install build tools needed for native dependencies (e.g. @hashgraph/sdk)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src/ ./src/
COPY tsconfig.json ./

# Compile TypeScript to JavaScript
RUN npx tsc

# The compiled output lives in /app/dist/
# node_modules stays at /app/node_modules/
# OpenClaw mounts this volume at /app/mcp-server/ and runs:
#   node /app/mcp-server/dist/index.js
