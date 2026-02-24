FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY mcp-server/package*.json ./mcp-server/
RUN npm ci && npm --prefix mcp-server ci

COPY . .
RUN npm run build && npm --prefix mcp-server run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV AIKNOWSYS_SQLITE_ONLY=true
ENV AIKNOWSYS_DB_PATH=/app/.aiknowsys/knowledge.db
ENV AIKNOWSYS_PROJECT_ROOT=/app

COPY --from=build /app /app

CMD ["sh", "-c", "node dist/scripts/sync-skills.js && node mcp-server/dist/index.js"]
