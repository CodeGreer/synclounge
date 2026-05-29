# MovieNight Fork Notes

This repository is the MovieNight fork of SyncLounge.

## Current local dev/runtime URL

MovieNight dev URL:
http://192.168.0.59:8092

Health check:
curl -s http://127.0.0.1:8092/health

Expected health response:
{"load":"low"}

## OMV Compose service

This project is managed through the OMV Compose web interface.

Current service command:
command: sh -c "npm ci && npm run build && node server.js --port 8092"

Current environment values:
TZ=America/New_York
SKIP_BUILD=true

SKIP_BUILD=true prevents the package prepare script from running an extra build during install.
The explicit npm run build in the service command still performs the production build before starting the SyncLounge server.

## Current working baseline

The app is confirmed working when this appears in container logs:
SyncLounge Server successfully started on port 8092

The health check should return:
{"load":"low"}

The UI should load at:
http://192.168.0.59:8092

The UI should allow connecting to a room with Plex libraries visible.

## Notes

Do not run broad cleanup or dependency update commands casually.

Avoid these unless intentionally planned:
npm audit fix
npm audit fix --force
npx update-browserslist-db@latest
docker system prune
docker compose down --remove-orphans
docker volume prune

The current Sass/Browserslist warnings are noisy but not blocking the running app.
