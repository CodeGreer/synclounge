# MovieNight Current Implementation

This document summarizes the MovieNight features that are implemented today and the beta constraints that still apply.

## Project identity

MovieNight is currently a SyncLounge fork. It retains the SyncLounge playback-sync foundation, socket room model, Plex authentication flow, and several internal package/module names while adding group movie-night features.

Remaining internal names such as `synclounge`, `syncloungeserver`, and SyncLounge-flavored config keys are technical compatibility details. User-facing documentation and normal product copy should present the project as MovieNight while still acknowledging the fork relationship and upstream attribution.

## Implemented features

### Host Controller

The host can open a separate Host Controller window for browsing and room management while the main host/player window continues to own playback, socket identity, and sync state.

The Host Controller:

- is a control surface only
- is not a room participant
- does not appear in the attendee list
- is not eligible to become host
- sends commands through the paired main host/player window
- can browse Plex libraries and search results
- can manage nominations, polls, and playlist state

### Nominations

Participants can nominate Plex movies, shows, or episodes. Movies and episodes can be added to the playlist as playable items. Shows/series are useful nomination candidates but are not directly playable playlist items.

### Approval voting

The host can start an approval vote from nominations. Participants can approve or unapprove any candidates while the vote is open. Closing the vote shows winner, tie, or no-approval state.

### Runoff voting

After a vote is closed, the host can start a runoff from the top 2, top 3, or top 5 results. A runoff starts a new voting round and clears previous votes.

### Host playlist

The host can add, remove, reorder, clear, and play playlist items. Playlist state is room-backed and synced to participants.

### Playlist visibility

Playlist visibility supports:

- private
- next item only
- public

Guests see read-only playlist information according to the selected visibility mode.

### Playlist auto-play

Playlist auto-play is optional. When enabled, the host/player window advances to the next playlist item after natural media end. Manual Stop does not auto-advance the playlist.

### Active playlist item tracking

The room tracks the active playlist item. Active state is cleared when the active item is removed or the playlist is cleared.

### Stale Host Controller invalidation after host transfer

When host control transfers away from a user, that user's paired Host Controller becomes inactive. The old controller should show a clear warning, hide or disable stale host controls, and stale controller commands must not change room state.

Server-side host checks remain authoritative; client-side controller invalidation is a clarity and safety layer.

## Beta constraints

MovieNight currently inherits SyncLounge's Plex authentication model:

- Plex authentication is required.
- Every participant needs Plex credentials.
- Every participant needs access to the relevant Plex server/library.
- Anonymous guests are not implemented.
- Local-only guest accounts are not implemented.
- Voting-only users are not implemented.
- Votes and room state are not persisted after server restart.

## Technical notes

- The Vuex room module namespace remains `synclounge`.
- The server package name remains `syncloungeserver`.
- Config keys with `synclounge` names remain for compatibility.
- The root Dockerfile predates the MovieNight fork and should be tested before production use.
- The server package default port is `8088`; the current dev environment commonly runs MovieNight on `8092`.

## Beta verification

Run these checks before a beta session when the dev container is available:

```sh
git status --short
git log --oneline -8
docker exec -it movienight-dev sh -lc 'cd /workspace/movienight && npm run build >/tmp/movienight-build.log 2>&1; code=$?; tail -80 /tmp/movienight-build.log; exit $code'
./scripts/check-movienight-socket-state.sh
curl -s http://127.0.0.1:8092/health; echo
```

Expected output includes:

```text
DONE  Build complete. The dist directory is ready to be deployed.
PASS: MovieNight playlist and poll state synced to guest
{"load":"low"}
```
