# MovieNight Beta Readiness

This checklist defines what should be true before trying MovieNight with the regular group.

## Core room flow

- [ ] Host can create/join a room.
- [ ] Guests can join the same room.
- [ ] Host can start playback.
- [ ] Guests sync playback to the host.
- [ ] Host transfer still works for normal participants.
- [ ] Controller windows do not become participants or hosts.

## Host Controller

- [ ] Host can open the Host Controller from the main host/player window.
- [ ] Controller can browse while playback continues in the main window.
- [ ] Controller can nominate titles.
- [ ] Controller can manage nominations.
- [ ] Controller can manage votes.
- [ ] Controller can manage playlist items.
- [ ] Controller shows guidance to keep the main host/player window open.

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

- [ ] Browser title says MovieNight.
- [ ] Join screen says MovieNight.
- [ ] Built-in player labels say MovieNight.
- [ ] Startup log says MovieNight.
- [ ] Runtime config uses MovieNight image.
- [ ] No obvious user-facing SyncLounge branding remains in normal flow.

## Smoke checks

Run before a beta session:

    git status --short

    docker exec -it movienight-dev sh -lc 'cd /workspace/movienight && npm run build >/tmp/movienight-build.log 2>&1; code=$?; tail -80 /tmp/movienight-build.log; exit $code'

    ./scripts/check-movienight-socket-state.sh

    curl -s http://127.0.0.1:8092/health; echo

Expected:

    DONE  Build complete. The dist directory is ready to be deployed.
    PASS: MovieNight playlist and poll state synced to guest
    {"load":"low"}

## Known beta limitations

- Room state is not persisted after server restart.
- Votes are tied to current socket connection.
- Plex is the only supported backend.
- Library-wide polling is deferred.
- Timers and blind voting are deferred.
- Games are deferred.
- Dedicated user accounts are deferred.
