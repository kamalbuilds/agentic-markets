FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production=false

COPY src/ ./src/
COPY tsconfig.json ./

# Compile TypeScript to JavaScript
RUN npx tsc

# The compiled output lives in /app/dist/
# OpenClaw will run: node /app/mcp-server/dist/index.js
