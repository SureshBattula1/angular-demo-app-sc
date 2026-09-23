# ---- Build stage: compile the Angular app ----
FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_OPTIONS=--max_old_space_size=4096

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Uses the "docker" configuration (apiUrl = /api, served same-origin via nginx).
RUN npm run build -- --configuration=docker

# ---- Serve stage: static files behind nginx ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ui-app/browser /usr/share/nginx/html
EXPOSE 80
