# Sync-A-Rama Selection Sessions

Sync-A-Rama currently supports an approval-voting workflow built around nominations.

## Current workflow

1. Participants nominate Plex movies, shows, or episodes.
2. The host starts an approval vote from current nominations.
3. Participants approve any title they would be happy watching.
4. The host closes the vote.
5. Sync-A-Rama shows winner, tie, or no-approval state.
6. The host can add the winner/top tied result to the playlist.
7. The host can start a runoff from the top 2, top 3, or top 5 results.
8. Runoffs start a new round and clear previous votes.

## Current host/controller support

The host can manage voting from the main host/player window or from the Host Controller window.

The Host Controller is not a room participant. It sends commands through the main host/player window, so the host/player window must remain open.

Supported controller actions:

- Add nominations
- Remove nominations
- Add nominations to the playlist
- Start approval vote from nominations
- Close vote
- Clear vote
- Start runoff from top results
- Add winner/top tied result to playlist
- Manage playlist visibility
- Manage playlist auto-play
- Play playlist items
- Remove playlist items
- Clear playlist

## Current voting rules

- Voting mode: approval only.
- Source: current nominations only.
- One active poll per room.
- Votes are tracked by current socket/participant.
- Participants can approve or unapprove candidates while the vote is open.
- Closed votes are read-only.
- Runoffs are generated from the previous closed vote's top results.

## Current beta constraints and limitations

- Plex authentication is required for all participants.
- Participants need Plex credentials and, for supported playback, pre-existing access to the originating Plex server/library for each selected item.
- Anonymous guests, local-only guest accounts, and voting-only users are not implemented.
- Votes are not persisted after a room/server restart.
- Votes are tied to the current socket connection, not a permanent user identity.
- Library-based polls are deferred.
- Single-choice, ranked-choice, timers, and blind results are deferred.
- Jellyfin and Emby are planned media-server backends but are not implemented.
- Cross-library fallback matching is an unsupported inherited safety net, not part of the intended beta workflow.
- Games are deferred.

## Intended beta scope

For beta, Sync-A-Rama should focus on making the Plex-backed Saturday-night flow reliable:

- Host Controller
- Nominations
- Approval voting
- Runoff
- Add winner to playlist
- Playlist management
- Auto-play playlist
- Active item tracking
- Clear user guidance
