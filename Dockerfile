# Base image: Node.js 22 on Debian Slim (fixes libsql musl errors)
FROM node:22-slim

# Install Git (required for cloning and pushing) and Python 3 (required for yt-dlp/youtube-dl-exec and youtube transcript skill)
RUN apt-get update && apt-get install -y git python3 python3-pip python-is-python3 && rm -rf /var/lib/apt/lists/*
RUN pip3 install youtube-transcript-api --break-system-packages
# Set working directory
WORKDIR /app

# Copy the monorepo package definitions (omitting package-lock.json to force native Linux resolution)
COPY package.json ./
COPY apps/bot/package.json ./apps/bot/

# Install dependencies and force install native modules for linux x64
RUN npm install

# Copy the rest of the application code
COPY . .

# Install Codex CLI and Netlify CLI globally so the worker can spawn them
RUN npm install -g @openai/codex netlify-cli
# Set environment variables (these should be provided at runtime via Railway/Render)
# ENV TELEGRAM_BOT_TOKEN=...
# ENV TURSO_DATABASE_URL=...
# ENV GITHUB_PAT=...
# ENV CODEX_API_KEY=...

# Start the Cloud Worker (which polls Turso, clones via Git, and runs Codex)
CMD ["npm", "run", "start-all", "--workspace=apps/bot"]
