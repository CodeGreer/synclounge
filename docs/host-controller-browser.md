# MovieNight Host Controller Browser

## Product goal

MovieNight should let the host fully browse Plex libraries while playback continues uninterrupted.

This is the primary differentiator from SyncLounge. Voting, nominations, games, and other group features are valuable, but the core MovieNight experience is:

- the main room/player window keeps playing and syncing content
- the host can open a separate controller/browser surface
- the host can browse libraries, shows, seasons, episodes, and search results normally
- the host can queue, nominate, reorder, and start titles without disturbing playback

## Current related features

MovieNight already has:

- room-backed MovieNight state
- nominations
- host playlist
- playlist visibility
- playlist add/reorder/remove/clear
- Play
- Play & Remove
- existing SyncLounge host transfer through the user-list star control
- existing SyncLounge auto-host behavior for normal room participants

These should be preserved unless they directly conflict with the controller/browser goal.

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
- execute MovieNight room actions

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

That keeps the existing socket/server model intact:

    controller window
    -> local controller channel
    -> real host/player window
    -> existing Vuex action
    -> existing room socket event
    -> server MovieNight state
    -> movieNightState broadcast

## Host and auto-host behavior

Existing host transfer should stay intact.

The current user-list star control already lets the host transfer duties to another user. We should not rebuild this unless a specific limitation appears.

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

## First implementation direction

The first implementation should focus on proving the controller/browser model without changing host identity:

1. Add a controller/browser route or mode that can browse Plex without becoming a room participant.
2. Add a host-only button to open the controller/browser window.
3. Add a BroadcastChannel bridge between controller window and main host window.
4. Route a small command first, likely add playlist item.
5. Expand to playlist management and play controls after the bridge is proven.
