FROM ghcr.io/zjuuu/openclaw-docker:openclaw-v2026.2.12

# Install Node.js for MCP server (OpenClaw image is Debian-based)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy MCP server
COPY mcp-server /app/mcp-server
WORKDIR /app/mcp-server
RUN npm ci --production

# Copy OpenClaw config and skills
COPY openclaw/openclaw.json /data/.openclaw/openclaw.json
COPY openclaw/skills /data/skills

# Back to root
WORKDIR /

# Expose setup UI
EXPOSE 8080
