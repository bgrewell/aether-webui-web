# aether-webui

Web-based setup wizard and dashboard for the Aether stack.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later (bundled with Node.js)
- The Aether backend API reachable at `http://127.0.0.1:8186` (or a custom URL — see [Configuration](#configuration))

---

## Configuration

Copy `.env` and adjust the values as needed before running any commands:

```
VITE_BACKEND_URL=http://127.0.0.1:8186
```

| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://127.0.0.1:8186` | Base URL of the Aether backend API |

> The UI performs a health check against `$VITE_BACKEND_URL/healthz` on load and will display a banner if the backend is unreachable or unhealthy.

---

## Development

Install dependencies once:

```bash
npm install
```

Start the development server with hot-reload:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default. In development mode the Vite dev server proxies all `/api/*` requests to `VITE_BACKEND_URL`, so you will not hit CORS issues while working locally.

To check for TypeScript errors without building:

```bash
npm run typecheck
```

---

## Production

### Build

Compile and bundle the app into the `dist/` directory:

```bash
npm run build
```

### Preview the production build locally

Serve the compiled output with Vite's built-in preview server:

```bash
npm run preview
```

The preview server listens on `http://localhost:4173` by default.

### Serve with a static file server

The contents of `dist/` are plain static files and can be served by any web server (nginx, Caddy, Apache, etc.).

**nginx example:**

```nginx
server {
    listen 80;
    root /path/to/aether-webui/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8186;
    }
}
```

> The `/api/` proxy block is only necessary if the backend runs on a different origin than the UI. If they share a domain you can omit it.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type-check and bundle for production |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run TypeScript compiler without emitting files |
| `npm run lint` | Run ESLint across the project |
