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

## Local dev/runtime URL

When running locally or in Docker, use the host and port configured by your environment.

Example local URL:

```text
http://localhost:8092
```

Example LAN URL:

```text
http://SERVER-IP:8092
```

Health check:

```sh
curl -s http://127.0.0.1:8092/health
```

Expected health response:

```json
{"load":"low"}
```

## Docker/Compose notes

MovieNight can be run with Docker or Docker Compose.

Example source-development command:

```sh
command: sh -c "npm ci && npm run build && node server.js --port 8092"
```

Example environment values:

```text
TZ=Etc/UTC
SKIP_BUILD=true
BRANDING_NAME=MovieNight
BRANDING_IMAGE_URL=
```

`SKIP_BUILD=true` prevents the package prepare script from running an extra build during install. The explicit `npm run build` in the service command still performs the production build before starting the server.

### Branding configuration

No branding environment variables are required. With no branding variables set,
MovieNight uses the canonical name `MovieNight`, the bundled MovieNight logo,
visible branding text in the normal branding locations, and a browser title of
`MovieNight` after runtime config loads.

Common optional settings:

- `BRANDING_NAME`: canonical instance name. Empty or whitespace-only values fall
  back to `MovieNight`. This value also controls the browser tab title even when
  visible branding text is hidden.
- `BRANDING_IMAGE_URL`: custom branding image URL. Empty or whitespace-only
  values use the bundled MovieNight logo. Use an HTTPS image URL when MovieNight
  is served over HTTPS, or use a same-origin/reverse-proxied relative path such
  as `/custom/branding.png`; browsers may block plain HTTP images on HTTPS pages.
- `BRANDING_FAVICON_URL`: optional browser favicon URL. Empty or whitespace-only
  values retain the bundled MovieNight favicon.
- `BRANDING_SHOW_NAME`: global control for the separately rendered branding name.
  Supported values include `true`, `false`, `1`, `0`, `"true"`, `"false"`,
  `"1"`, and `"0"`. Empty or unrecognized values are treated as unset. The
  final default is `true`.

Advanced optional location overrides:

- `BRANDING_TOP_BAR_SHOW_NAME`: controls the persistent top application bar.
- `BRANDING_SIGN_IN_SHOW_NAME`: controls the Plex sign-in screen.
- `BRANDING_ROOM_JOIN_SHOW_NAME`: controls the normal room/invite joining screen.
- `BRANDING_ROOM_CREATION_SHOW_NAME`: controls the normal room creation/connect
  screen.
- `BRANDING_ADVANCED_JOIN_SHOW_NAME`: controls the advanced joining flow,
  including client selection, server joining, and the advanced room walkthrough.

Location overrides inherit from `BRANDING_SHOW_NAME`. Empty, whitespace-only, or
unrecognized location override values inherit rather than forcing `true` or
`false`. If `BRANDING_SHOW_NAME` is unset, empty, or unrecognized, name display
ultimately defaults to `true`.

Custom branding images may be square icons or wide combined logo/wordmark images.
MovieNight preserves the image aspect ratio while constraining the image to the
available UI space. Full-page branding locations use a larger responsive image
limit, while the persistent top bar remains compact; there is no operator-facing
image-dimension configuration.

Default deployment:

```yaml
services:
  movienight:
    image: ghcr.io/codegreer/movienight:beta
    ports:
      - "8088:8088"
```

Basic renamed instance:

```yaml
environment:
  BRANDING_NAME: "Tom's Movie Club"
```

Custom name and image:

```yaml
environment:
  BRANDING_NAME: "Example Movie Club"
  BRANDING_IMAGE_URL: "https://example.com/example-logo.png"
  BRANDING_FAVICON_URL: "https://example.com/example-icon.png"
```

Image-only branding:

```yaml
environment:
  BRANDING_NAME: "Example Movie Club"
  BRANDING_IMAGE_URL: "https://example.com/example-logo.png"
  BRANDING_SHOW_NAME: "false"
```

Image-only by default, but name visible in advanced joining:

```yaml
environment:
  BRANDING_NAME: "Example Movie Club"
  BRANDING_IMAGE_URL: "https://example.com/example-logo.png"
  BRANDING_SHOW_NAME: "false"
  BRANDING_ADVANCED_JOIN_SHOW_NAME: "true"
```

The app is confirmed working when this appears in logs:

```text
MovieNight Server successfully started on port <port>
```

## Beta smoke checks

Run before a beta session or documentation release when the dev container is available:

```sh
git status --short
git log --oneline -8
docker exec -it <dev-container-name> sh -lc 'cd /workspace/movienight && npm run build >/tmp/movienight-build.log 2>&1; code=$?; tail -80 /tmp/movienight-build.log; exit $code'
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
