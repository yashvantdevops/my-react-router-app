# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.

# React Router — Docker & Compose Ready

This repository is a full-stack React Router template (SSR-capable) updated to run reliably inside Docker with a production-ready Dockerfile and Compose setup. The README below documents the new Docker workflow, recommended compose file, and troubleshooting notes for Windows bind mounts and nginx.

## Prerequisites

- Docker Desktop (Windows) with WSL2 backend recommended
- Node.js (for local development)
- npm

## Local dev (unchanged)

Install and run locally:

```bash
npm install
npm run dev         # dev server with HMR (usually http://localhost:5173)
npm run build       # produce build/client and build/server
npm start           # runs server.mjs (production server)
```

Verify `npm run build` produces:
- build/client/   — static assets
- build/server/   — server entry used by server.mjs

## Docker concepts used

- Multi-stage Dockerfile: build stage produces optimized `build/`, final image runs production server
- docker-compose: brings up two services:
  - app — Node server that serves SSR / API
  - nginx — static file server + reverse proxy for client requests (optional)
- Persistent mounts:
  - node_modules: mount a container-only volume to avoid host/permission issues
  - build: optional bind mount during development; in production use build from image
- Custom bridge network so services can communicate by name

## Recommended files

Save these in the project root.

1) docker-compose.yml (development + optional nginx)

```yaml
version: "3.8"
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: react-router-app
    ports:
      - "3000:3000"         # server.mjs
      - "5173:5173"         # vite (if you run dev inside container)
    volumes:
      - .:/app:delegated
      - /app/node_modules   # anonymous volume to avoid host node_modules override
      - /app/build          # optional: persist build output in container
    environment:
      NODE_ENV: development
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: react-router-nginx
    ports:
      - "80:80"
    depends_on:
      - app
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro   # HOST FILE -> CONTAINER FILE
      - ./build/client:/usr/share/nginx/html:ro                 # ensure this path exists and is a directory
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

Important: name the compose file `docker-compose.yml` (or pass `-f compose.yml` to docker compose) and ensure host paths exist and are the expected type (file vs directory).

2) Example production Dockerfile (multi-stage)

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY server.mjs .
EXPOSE 3000
CMD ["npm", "start"]
```

3) Example nginx/default.conf

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location /static/ {
    try_files $uri =404;
  }

  # Proxy SSR/dynamic routes to node app
  location / {
    try_files $uri @proxy;
  }

  location @proxy {
    proxy_pass http://app:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## How to run (development)

1. Build image and start services:
```powershell
# Windows PowerShell
docker compose up --build -d
```

2. Check logs:
```powershell
docker compose logs -f app
docker compose logs -f nginx
```

3. Stop and remove:
```powershell
docker compose down
```

## How to run (production)

- Run `npm run build` locally or rely on the Docker builder stage.
- Use the same compose but set `NODE_ENV=production` and remove the source bind mount for `/app` so the container uses the image’s built files:
  - Remove the `- .:/app` volume for the `app` service in production.

## Common issues & fixes

- Error mounting nginx default.conf: "not a directory"  
  Cause: host path used for mounting is a directory while container expects a file (or vice versa).  
  Fix: Ensure `./nginx/default.conf` exists and is a file. On Windows check path case and that Docker Desktop has the drive shared.

- Error "Cannot find module '/app/build/server/index.js'"  
  Cause: build failed or build output not copied into image.  
  Fix: Ensure `npm run build` creates `build/server/index.js` and Dockerfile copies `/app/build` from the builder stage.

- Error "Cannot read properties of undefined (reading 'routes')" or ESM import errors  
  Cause: mismatched Node version or incorrect build exports (server expects specific export shape).  
  Fix: Use Node v18+ (v24 recommended) and confirm `build/server/index.js` exports the expected `default` or `entry` shape. Test locally with `node server.mjs` before Docker.

- Windows bind mount oddities (file vs directory)  
  Fix: Use explicit file mounts (host path to a file) and verify the host file exists. Consider using anonymous/container volumes for `node_modules` to avoid host permission problems.

## Helpful commands

```powershell
# Rebuild images and recreate containers
docker compose up -d --build

# Tail logs
docker compose logs -f app

# Exec into app container
docker compose exec app sh

# Remove containers, networks, and anonymous volumes
docker compose down --volumes
```

## Summary

- Keep `nginx/default.conf` as a file (not a folder) and confirm its path before starting Compose.
- Use an anonymous volume for `/app/node_modules` to avoid host overwrite problems.
- For production, build inside the Docker builder stage and avoid mounting source code.
- Use `app` service name as upstream host in nginx config (Compose network).

If you want, I can generate a final docker-compose.yml and nginx/default.conf tailored to your current repo layout.
