FROM node:20-alpine AS api

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/

# ── Instalar nginx para forzar CORS headers ──────────────────
FROM node:20-alpine

RUN apk add --no-cache nginx supervisor

WORKDIR /app
COPY --from=api /app /app
COPY nginx-backend.conf /etc/nginx/http.d/default.conf

# Supervisor: corre nginx + node juntos
RUN cat > /etc/supervisord.conf << 'SUPERVISOREOF'
[supervisord]
nodaemon=true
logfile=/dev/null
logfile_maxbytes=0

[program:node]
command=node /app/src/index.js
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
SUPERVISOREOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
