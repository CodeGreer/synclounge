# AGENTS.md

## Project identity

This repository is MovieNight, a fork/rebrand/extension of SyncLounge for weekly group movie nights.

MovieNight still uses much of the SyncLounge architecture, package naming, and Plex authentication flow. Do not assume old SyncLounge names are automatically wrong, but do flag obvious remaining user-facing SyncLounge branding.

## Working environment

- Repository: git@github.com:CodeGreer/synclounge.git
- Main branch: master
- Local checkout path: use the path where this repository is cloned.
- App URL: use the host/port configured for the local or containerized dev environment.
- Dev container/service: use the name configured by the local Docker/Compose setup.

Run npm/node commands inside the project dev container when one is being used, unless explicitly instructed otherwise.

Example build command:

    docker exec -it <dev-container-name> sh -lc 'cd /workspace/movienight && npm run build'

A typical dev container startup command runs npm ci, then npm run build, then node server.js with the configured port. After a container restart, the app may be unavailable until install/build/startup completes.

## Safety rules

- Do not run destructive Docker commands.
- Do not run Docker prune commands.
- Do not run forced package upgrades.
- Do not run npm audit fix.
- Do not force-push.
- Do not rewrite git history.
- Do not make large unsupervised changes.
- Prefer small, reviewable patches.
- Keep code and documentation changes in separate commits when practical.
- Ask before changing authentication, deployment, Docker packaging, or host-transfer behavior.

## Verification

Before and after meaningful changes, prefer these checks:

    git status --short
    git log --oneline -8

    docker exec -it <dev-container-name> sh -lc 'cd /workspace/movienight && npm run build >/tmp/movienight-build.log 2>&1; code=$?; tail -80 /tmp/movienight-build.log; exit $code'

    ./scripts/check-movienight-socket-state.sh

    curl -s http://127.0.0.1:8092/health; echo

Expected results:

    DONE  Build complete. The dist directory is ready to be deployed.
    PASS: MovieNight playlist and poll state synced to guest
    {"load":"low"}

If server source changes under packages/syncloungeserver/src, also run:

    docker exec -it <dev-container-name> sh -lc 'cd /workspace/movienight/packages/syncloungeserver && npm run build'

When server source changes are made, commit both the source files and generated packages/syncloungeserver/dist files.

## Current architecture notes

MovieNight currently uses Plex authentication. There are no anonymous guests, local-only guest accounts, or voting-only users yet.

Every beta participant must sign in with Plex credentials and must have access to the relevant Plex server/library.

The Host Controller model is:

- Main host/player window:
  - real room participant
  - eligible to be host
  - owns playback/sync identity
  - executes MovieNight room actions

- Host Controller window:
  - control surface only
  - not a room participant
  - not eligible to be host
  - does not appear in the attendee list
  - sends commands through the paired main host/player window

Controller windows communicate with the paired host/player window through a room-scoped BroadcastChannel.

Server-side host checks remain authoritative. Client-side controller state is only a clarity and safety layer.

## Host transfer behavior

Host transfer between real participants must continue to work.

When host control transfers away from a user:

- the old main/player window is no longer host
- the old Host Controller must become inactive
- the old Host Controller should show a clear warning
- stale controller controls should be hidden or disabled
- stale controller commands must not change room state

Do not make controller windows participants or host candidates.

## Implemented MovieNight features

MovieNight currently includes:

- nominations
- approval voting
- runoff voting from top results
- host playlist
- playlist visibility modes
- playlist auto-play
- active playlist item tracking
- Host Controller browsing/control
- stale Host Controller invalidation after host transfer

Movies and episodes are playable playlist items. Shows/series can be nominated but are not directly playable playlist items.

## Important files

MovieNight UI/components:

- src/components/MovieNightPanel.vue
- src/components/MovieNightPoll.vue
- src/components/MovieNightPlaylist.vue
- src/components/MovieNightNominationSearch.vue
- src/components/PlexItem.vue
- src/components/PlexThumbnail.vue
- src/mixins/movienightcontrollerbridge.js
- src/utils/movienightcontrollerchannel.js

MovieNight Vuex module:

- src/store/modules/movienight/state.js
- src/store/modules/movienight/getters.js
- src/store/modules/movienight/mutations.js
- src/store/modules/movienight/actions.js

Server state/socket handlers:

- packages/syncloungeserver/src/socketserver/state.js
- packages/syncloungeserver/src/socketserver/handlers.js
- packages/syncloungeserver/dist/socketserver/state.js
- packages/syncloungeserver/dist/socketserver/handlers.js

Regression/smoke test:

- scripts/check-movienight-socket-state.sh

Docs:

- docs/current-implementation.md
- docs/selection-sessions.md
- docs/beta-readiness.md
- docs/host-controller-browser.md

## Docker/package notes

The root Dockerfile predates the MovieNight fork but may still be usable because it builds the current checkout.

Do not assume Docker packaging is production-ready without testing:

- image build
- container startup
- /health
- browser load
- socket smoke behavior where applicable

The server package default port is currently 8088. The dev environment commonly uses 8092. Docker Compose or reverse proxy configuration may map an external port to the container's internal port.

## Development style

Favor one small, recoverable step at a time.

For tasks, prefer:

1. inspect current code
2. make a minimal patch
3. show the diff
4. run the relevant verification
5. commit only after verification passes

Do not jump ahead to broad rewrites unless explicitly requested.
