# Build Stage
FROM node:26-alpine AS builder
WORKDIR /app

# 1. Copy only package files to cache npm install step
COPY package*.json ./
RUN npm install

# 2. Copy only the necessary configuration files and source code
COPY index.html vite.config.ts tsconfig.json tsconfig.*.json eslint.config.js ./
COPY src ./src
COPY public ./public

# 3. Build the application
RUN npm run build

# Production Stage
FROM nginx:alpine
# 4. Copy ONLY the built static assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# 5. Copy the nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 6. Copy and set entrypoint script to inject runtime env variables
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
