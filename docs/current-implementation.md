# Sync-A-Rama Current Implementation

This document summarizes the Sync-A-Rama features that are implemented today and the beta constraints that still apply.

## Project identity

Sync-A-Rama is currently a SyncLounge fork. It retains the SyncLounge playback-sync foundation, socket room model, Plex authentication flow, and several internal package/module names while adding group movie-night features.

Remaining internal names such as `synclounge`, `syncloungeserver`, and SyncLounge-flavored config keys are technical compatibility details. User-facing documentation and normal product copy should present the project as Sync-A-Rama while still acknowledging the fork relationship and upstream attribution.

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

Sync-A-Rama currently inherits SyncLounge's Plex authentication model:

- Plex authentication is required.
- Every participant needs Plex credentials.
- For supported playback, every participant needs pre-existing Plex access to the originating server/library for each selected item.
- Anonymous guests are not implemented.
- Local-only guest accounts are not implemented.
- Voting-only users are not implemented.
- Votes and room state are not persisted after server restart.
- Plex is currently the only implemented media-server backend.

Jellyfin and Emby are planned as first-class selectable backends. Supporting those backends does not imply a decentralized room model in which every participant routinely uses an independent source. See `docs/roadmap.md` for the intended direction and architectural guidance.

The inherited Plex client contains a best-effort fallback that searches other Plex servers already available to a participant when the originating item cannot be used. This behavior has not been validated in group use and is not a supported beta capability.

## Technical notes

- The Vuex room module namespace remains `synclounge`.
- The server package name remains `syncloungeserver`.
- Config keys with `synclounge` names remain for compatibility.
- The root Dockerfile predates the Sync-A-Rama fork and should be tested before production use.
- The server package default port is `8088`; the current dev environment commonly runs Sync-A-Rama on `8092`.

## Compatibility identifiers intentionally retained

The rebrand intentionally keeps these identifiers until there is a separate compatibility migration plan:

- `synclounge` Vuex namespaces and inherited `synclounge_*` config keys.
- The `syncloungeserver` package and binary name.
- Socket protocol names such as `movieNightState` and `movieNight*` mutating events.
- MovieNight-specific source filenames, Vue component names, helper names, the `movienight` Vuex namespace, and `movienight-controller` BroadcastChannel names.
- The existing bundled `movienight-small-light.png` image and current favicon as temporary legacy assets.

## Beta verification

Run these checks before a beta session when the dev container is available:

```sh
git status --short
git log --oneline -8
docker exec -it movienight-dev sh -lc 'cd /workspace/movienight && npm run build >/tmp/syncarama-build.log 2>&1; code=$?; tail -80 /tmp/syncarama-build.log; exit $code'
./scripts/check-syncarama-socket-state.sh
curl -s http://127.0.0.1:8092/health; echo
```

Expected output includes:

```text
DONE  Build complete. The dist directory is ready to be deployed.
PASS: Sync-A-Rama playlist, poll, Auto-Host, and host-transfer state verified
{"load":"low"}
```
