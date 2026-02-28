# Base image: Node.js 22 on Debian Slim (fixes libsql musl errors)
FROM node:22-slim

# Install Git (required for cloning and pushing)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the monorepo package definitions
COPY package.json package-lock.json* ./
COPY apps/bot/package.json ./apps/bot/
COPY apps/web/package.json ./apps/web/

# Install dependencies (this will set up npm workspaces)
RUN npm install

# Copy the rest of the application code
COPY . .

# Install Codex CLI globally so the worker can spawn it
RUN npm install -g @openai/codex

# Set environment variables (these should be provided at runtime via Railway/Render)
# ENV TELEGRAM_BOT_TOKEN=...
# ENV TURSO_DATABASE_URL=...
# ENV GITHUB_PAT=...
# ENV CODEX_API_KEY=...

# Start the Cloud Worker (which polls Turso, clones via Git, and runs Codex)
CMD ["npm", "run", "cloud-worker", "--workspace=apps/bot"]
