# Sync-A-Rama Beta Readiness

This checklist defines what should be true before trying Sync-A-Rama with the regular group.

## Current beta constraints

Sync-A-Rama currently inherits SyncLounge's Plex authentication model.

Every beta participant must sign in with Plex credentials and must have access
to the relevant Plex server/library. Sync-A-Rama does not currently support
anonymous guests, local-only guest accounts, or voting-only users.

Because of this, real guest joining, guest voting clarity, host transfer between
users, and multi-household sync require additional Plex-authenticated testers.


## Public room trust boundary

Sync-A-Rama intentionally keeps the upstream SyncLounge public-room model for beta: a room URL should be treated as joinable by anyone who knows or guesses the room name. Plex login still controls access to Plex accounts, servers, and libraries, but the room socket server does not treat the browser client as trusted just because the user reached a room.

The server now applies Sync-A-Rama-specific safety limits before rebroadcasting shared room state. Nominations and playlist items are whitelisted and trimmed, unknown fields are ignored, malformed items are rejected, nominations and playlist arrays are capped at 100 items each, active polls are capped at 50 options, and votes must reference current poll option IDs. Sync-A-Rama mutating socket actions and chat messages also have generous per-socket fixed-window rate limits to reduce accidental or malicious spam. Chat messages are trimmed, capped, and treated as plain text.

These caps and rate limits protect nomination, poll, vote, playlist, and chat state from unbounded growth in public-room beta use. They are not a replacement for full server-side Plex authorization or token validation, which remains out of scope for the current beta architecture.

The beta server also intentionally allows cross-origin HTTP and Socket.IO access for self-hosted deployments, alternate LAN hostnames, and reverse-proxy setups. This CORS policy is a compatibility choice, not an authentication boundary; room names and room URLs should still be treated as shareable access paths rather than private secrets.

## Core room flow

- [ ] Host can create/join a room.
- [ ] Plex-authenticated guests can join the same room.
- [ ] Host can start playback.
- [ ] Guests sync playback to the host.
- [ ] Host transfer still works for normal participants.
- [ ] Previous host's controller becomes inactive after host transfer.
- [ ] Controller windows do not become participants or hosts.

## Host Controller

- [ ] Host can open the Host Controller from the main host/player window.
- [ ] Controller can browse while playback continues in the main window.
- [ ] Controller can nominate titles.
- [ ] Controller can manage nominations.
- [ ] Controller can manage votes.
- [ ] Controller can manage playlist items.
- [ ] Controller shows guidance to keep the main host/player window open.
- [ ] Controller shows an inactive warning if its paired player is no longer host.
- [ ] Inactive controller controls are hidden or disabled.

## Host transfer and old controller behavior

These checks require at least two Plex-authenticated users.

- [ ] User A is host.
- [ ] User A opens the Host Controller.
- [ ] User A confirms controller actions work while User A is host.
- [ ] Host control transfers from User A to User B.
- [ ] User A's Host Controller shows a clear inactive-controller message.
- [ ] User A's Host Controller host controls are hidden or disabled.
- [ ] User A's Host Controller cannot add nominations.
- [ ] User A's Host Controller cannot start, close, clear, or run off votes.
- [ ] User A's Host Controller cannot alter or play playlist items.
- [ ] User B becomes the active host.
- [ ] User B can control playback as host.
- [ ] User B's Host Controller works only if paired with User B's main player window.
- [ ] No stale controller command from User A changes room state after transfer.

## Nominations

- [ ] Participants can nominate from search.
- [ ] Host/controller can nominate from browse/detail pages.
- [ ] Movies and episodes can be added to the playlist.
- [ ] Shows/series can be nominated but are not treated as directly playable playlist items.
- [ ] Duplicate nominations are handled clearly enough for beta.

## Approval voting

- [ ] Host/controller can start a vote from nominations.
- [ ] Guests can approve/unapprove candidates while the vote is open.
- [ ] Host/controller can close the vote.
- [ ] Closed vote shows winner, tie, or no-approval state.
- [ ] Winner/top tied result can be added to the playlist.
- [ ] Runoff Top 2/3/5 works after a closed vote.
- [ ] Runoff starts a new round and clears previous votes.
- [ ] Host/controller can clear the vote.

## Playlist

- [ ] Host/controller can add playable nominations to the playlist.
- [ ] Host/controller can reorder playlist items.
- [ ] Host/controller can remove playlist items.
- [ ] Host/controller can clear the playlist.
- [ ] Active playlist item is shown.
- [ ] Auto-play next item works when enabled.
- [ ] Manual stop does not unexpectedly auto-advance.
- [ ] Playlist visibility modes work well enough for beta.

## Branding and visible copy

- [ ] Browser title says Sync-A-Rama.
- [ ] Join screen says Sync-A-Rama.
- [ ] Built-in player labels say Sync-A-Rama.
- [ ] Startup log says Sync-A-Rama.
- [ ] Runtime config uses Sync-A-Rama image.
- [ ] No obvious user-facing SyncLounge branding remains in normal flow.

## Smoke checks

Run before a beta session:

    git status --short

    docker exec -it syncarama-dev sh -lc 'cd /workspace/syncarama && npm run build >/tmp/syncarama-build.log 2>&1; code=$?; tail -80 /tmp/syncarama-build.log; exit $code'

    ./scripts/check-syncarama-socket-state.sh

    curl -s http://127.0.0.1:8092/health; echo

Expected:

    DONE  Build complete. The dist directory is ready to be deployed.
    PASS: Sync-A-Rama playlist and poll state synced to guest
    {"load":"low"}

## Known beta limitations

- Room state is not persisted after server restart.
- Votes are tied to current socket connection.
- Plex is the only supported backend.
- Library-wide polling is deferred.
- Timers and blind voting are deferred.
- Games are deferred.
- Dedicated user accounts are deferred.
- Anonymous or Plex-free guest access is deferred.
