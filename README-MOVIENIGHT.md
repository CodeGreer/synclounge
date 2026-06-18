# MovieNight Fork Notes

This repository is MovieNight, a fork/rebrand/extension of SyncLounge for weekly group movie nights.

MovieNight still uses some SyncLounge architecture, package names, config keys, and Plex authentication flow internally. Do not treat every internal `synclounge` name as stale branding; package names and compatibility keys remain intentionally unchanged for now.

## Implemented beta features

MovieNight currently includes:

- Host Controller browsing/control from a separate window
- nominations for Plex movies, shows, and episodes
- approval voting from nominations
- runoff voting from top closed-vote results
- host-managed playlist
- playlist visibility modes: private, next item only, and public
- playlist auto-play after natural media end
- active playlist item tracking
- stale Host Controller invalidation after host transfer

Movies and episodes are playable playlist items. Shows/series can be nominated but are not directly playable playlist items.

## Current beta constraints

- Plex authentication is required.
- Every participant needs Plex credentials.
- Every participant needs access to the relevant Plex server/library.
- Anonymous guests are not implemented.
- Local-only guest accounts are not implemented.
- Voting-only users are not implemented.
- Room state is in memory and is not persisted after server restart.

## Current local dev/runtime URL

MovieNight dev URL:

```text
http://192.168.0.59:8092
```

Health check:

```sh
curl -s http://127.0.0.1:8092/health
```

Expected health response:

```json
{"load":"low"}
```

## OMV Compose service

This project is managed through the OMV Compose web interface in the current dev environment.

Current service command:

```sh
command: sh -c "npm ci && npm run build && node server.js --port 8092"
```

Current environment values:

```text
TZ=America/New_York
SKIP_BUILD=true
```

`SKIP_BUILD=true` prevents the package prepare script from running an extra build during install. The explicit `npm run build` in the service command still performs the production build before starting the server.

The app is confirmed working when this appears in container logs:

```text
SyncLounge Server successfully started on port 8092
```

That startup string is an inherited internal server label, not intended as end-user MovieNight branding.

## Beta smoke checks

Run before a beta session or documentation release when the dev container is available:

```sh
git status --short
git log --oneline -8
docker exec -it movienight-dev sh -lc 'cd /workspace/movienight && npm run build >/tmp/movienight-build.log 2>&1; code=$?; tail -80 /tmp/movienight-build.log; exit $code'
./scripts/check-movienight-socket-state.sh
curl -s http://127.0.0.1:8092/health; echo
```

Expected results:

```text
DONE  Build complete. The dist directory is ready to be deployed.
PASS: MovieNight playlist and poll state synced to guest
{"load":"low"}
```

## Useful docs

- `docs/current-implementation.md`
- `docs/beta-readiness.md`
- `docs/selection-sessions.md`
- `docs/host-controller-browser.md`
- `docs/movienight-architecture-notes.md`

## Safety notes

Do not run broad cleanup, dependency update, or destructive Docker commands casually.

Avoid these unless intentionally planned:

```sh
npm audit fix
npm audit fix --force
npx update-browserslist-db@latest
docker system prune
docker compose down --remove-orphans
docker volume prune
```

The current Sass/Browserslist warnings are noisy but not blocking the running app.
