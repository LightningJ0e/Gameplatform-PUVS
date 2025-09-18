# syntax=docker/dockerfile:1.7

# Base stage with Node.js
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install dependencies (including devDependencies for build)
FROM base AS deps
COPY rps/package.json rps/package-lock.json ./
RUN npm ci

# Build the Next.js application
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Create production-only node_modules to shrink runtime image
FROM base AS prod-deps
COPY --from=deps /app/node_modules ./node_modules
COPY rps/package.json rps/package-lock.json ./
RUN npm prune --omit=dev

# Production runtime image
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1 \
	PORT=3000 \
	HOSTNAME=0.0.0.0

# Use non-root user provided by the Node image
USER node

# Copy only what's needed to run `next start`
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]

