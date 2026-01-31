# === Base: Install pnpm and set up workspace ===
FROM node:22.16.0 AS base

WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web-client/package.json ./apps/web-client/
COPY apps/web-admin/package.json ./apps/web-admin/
COPY apps/web-landing/package.json ./apps/web-landing/
RUN pnpm install --frozen-lockfile

COPY . .

# === Build stage: Build both client and api ===
FROM base AS builder
RUN pnpm build

# === Production stage: Only API (serves static client assets) ===
FROM node:22.16.0 AS production

WORKDIR /app
RUN npm install -g pnpm

# Install production deps for API only
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod

# Create public directory explicitly to avoid COPY creating a file
RUN mkdir -p /app/apps/api/public

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy built client static assets into public/
COPY --from=builder /app/apps/web-landing/dist/ ./apps/api/public/

WORKDIR /app/apps/api
EXPOSE 8080
CMD ["node", "dist/main.js"]