FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./

ENV VUE_PUBLIC_SITE_URL=$SITE_URL

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM nginx:alpine AS runner

ARG VERSION
ARG BUILD_TIME

# Custom Nginx configuration (must be configured to listen on port 8080)
COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy built static assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Writes /config.js from the container environment on start (see docker/runtime-config.sh)
COPY ./docker/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

ENV NODE_ENV=production
ENV VUE_APP_VERSION=$VERSION
ENV VUE_APP_BUILD_TIME=$BUILD_TIME

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]