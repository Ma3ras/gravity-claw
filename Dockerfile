# Base image: Node.js 22 on Alpine Linux
FROM node:22-alpine

# Install Git (required for cloning and pushing)
RUN apk add --no-cache git

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
