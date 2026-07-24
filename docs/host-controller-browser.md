# Sync-A-Rama Host Controller Browser

## Product goal

Sync-A-Rama should let the host fully browse Plex libraries while playback continues uninterrupted.

This is the primary differentiator from SyncLounge. Voting, nominations, games, and other group features are valuable, but the core Sync-A-Rama experience is:

- the main room/player window keeps playing and syncing content
- the host can open a separate controller/browser surface
- the host can browse libraries, shows, seasons, episodes, and search results normally
- the host can queue, nominate, reorder, and start titles without disturbing playback

## Current related features

Sync-A-Rama already has:

- room-backed Sync-A-Rama state
- nominations
- host playlist
- playlist visibility
- playlist add/reorder/remove/clear
- Play
- Play & Remove
- existing SyncLounge host transfer through the user-list star control
- existing SyncLounge auto-host behavior for normal room participants

These should be preserved unless they directly conflict with the controller/browser goal.

## Implemented behavior

The controller/browser model is now implemented.

The main host/player window remains the real room participant. The host can open a separate Host Controller window that browses Plex without joining the room as another attendee.

The Host Controller can currently:

- browse Plex libraries and search results
- nominate playable media
- add playable media to the Sync-A-Rama playlist
- reorder playlist items
- remove playlist items
- clear the playlist
- change playlist visibility
- toggle playlist auto-play
- start a playlist item through the real host/player window
- use Play & Remove through the real host/player window

The Host Controller communicates with the real host/player window over a room-scoped BroadcastChannel. The host/player window then executes the normal Vuex/socket actions, keeping the server-backed room state as the source of truth.

If the paired host/player window loses host status, the Host Controller becomes
inactive. It should show a clear warning that host control moved to another
participant and that the old controller can be closed. Its host-only controls
should be hidden or disabled.

The server remains the authority for host-only actions. Client-side controller
invalidation is a clarity and safety layer so stale controller windows do not
look usable after host transfer.

## Playlist behavior

The Sync-A-Rama playlist is room-backed state.

The playlist supports:

- private, next-only, and public visibility
- host/controller management controls
- read-only guest views based on visibility
- a server-backed active playlist item
- a visible “Now” chip for the currently active playlist item
- stale active-item cleanup when an active item is removed or the playlist is cleared

Playlist auto-play is off by default.

When playlist auto-play is on:

- the host/player window advances to the next playlist item after a natural media end
- the active item moves to the next playlist item
- manual Stop does not advance the playlist
- controller windows do not execute playback directly

When playlist auto-play is off:

- natural media end clears the active playlist item
- manual Stop clears the active playlist item
- playback does not advance

## Regression coverage

The Sync-A-Rama socket smoke test covers:

- playlist item add
- playlist reorder
- playlist visibility sync
- playlist auto-play state sync
- active playlist item state sync
- active playlist item clear
- remove active playlist item clears active state
- clear playlist clears active state


## Current beta constraints

- Plex authentication is required.
- The host and every participant need Plex credentials.
- Participants need access to the relevant Plex server/library.
- Anonymous guests, local-only guest accounts, and voting-only users are not implemented.

## Non-goals

The host controller/browser should not:

- appear as a second attendee in the room
- become eligible for auto-host
- clutter the user list
- duplicate or replace existing host-transfer behavior
- create a second competing playback/sync identity
- require rebuilding normal Plex browsing from scratch

## Desired architecture

### Main player window

The main player window remains the real room participant.

It should:

- join the room normally
- own the real SyncLounge socket identity
- be eligible to be host
- be eligible for existing host transfer
- be eligible for existing auto-host behavior
- manage playback and sync state
- execute Sync-A-Rama room actions

### Controller/browser window

The controller/browser window is a control surface, not a room participant.

It should:

- require Plex authentication
- provide full Plex browsing/search/detail routes
- preserve normal browsing behavior
- not join the SyncLounge room as another user
- not appear in the room user list
- not become host
- not trigger auto-host
- send commands to the main host window

## Command bridge

The preferred command bridge is a local browser-to-browser channel, scoped to the current room.

Likely mechanism:

    BroadcastChannel("movienight-controller:<roomId>")

The `movienight-controller:<roomId>` channel name is intentionally retained for
compatibility with the existing Host Controller bridge. Do not change the runtime
channel name in the Sync-A-Rama rebrand PR.

Controller window sends commands such as:

- addNomination
- addPlaylistItem
- removePlaylistItem
- movePlaylistItemUp
- movePlaylistItemDown
- clearPlaylist
- setPlaylistVisibility
- playPlaylistItem
- playAndRemovePlaylistItem

The main player/host window receives those commands and executes the existing Vuex actions.

The same channel also sends controller status back to the Host Controller. When
the paired player is the active host, the controller is active. When the paired
player is no longer host, the controller receives inactive status and stops
presenting host controls.

That keeps the existing socket/server model intact:

    controller window
    -> local controller channel
    -> real host/player window
    -> existing Vuex action
    -> existing room socket event
    -> server Sync-A-Rama state
    -> movieNightState broadcast

## Host and auto-host behavior

Existing host transfer should stay intact.

The current user-list star control already lets the host transfer duties to another user. We should not rebuild this unless a specific limitation appears.

When host control transfers away from a user, that user's paired Host Controller
should become inactive. The old controller window cannot be closed remotely, so
it should show a clear message that it can no longer control the room and can be
closed.

Auto-host should remain available for normal room participants.

Controller/browser windows should never be auto-host candidates because they are not real room participants.

## Takeover behavior

A separate Take Host or Claim Host feature may be useful later for abandoned or squatted rooms.

That should be treated as a separate feature from controller/browser mode.

Do not conflate:

- host transfer
- auto-host
- controller browser
- host takeover
