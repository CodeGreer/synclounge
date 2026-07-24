# Sync-A-Rama Architecture Notes

These notes describe the current SyncLounge architecture as observed in the Sync-A-Rama fork.

## Runtime responsibilities

The app server handles:
- Serving the built Vue app from dist
- Serving runtime config from /config.json
- Running the SyncLounge socket.io room server
- Serving /health

The browser/client handles:
- Plex authentication
- Plex server discovery
- Plex library browsing
- Plex metadata requests
- Plex client/player control
- Web player state

Plex requests are made directly from the browser to the chosen Plex server connection URI.

## Runtime config

Runtime config comes from config/defaults.js and is served at /config.json.

Operator-facing branding can be customized through runtime config with `branding_name` and `branding_image_url`. The app falls back to the current bundled legacy branding asset and name when those values are unset.

Current local Sync-A-Rama server label:
- Sync-A-Rama Local

## Main client-side files

Socket wrapper:
- src/socket.js

Room/socket Vuex module:
- src/store/modules/synclounge/actions.js
- src/store/modules/synclounge/eventhandlers.js
- src/store/modules/synclounge/state.js
- src/store/modules/synclounge/getters.js
- src/store/modules/synclounge/mutations.js

Main room join flow:
1. SET_AND_CONNECT_AND_JOIN_ROOM
2. CONNECT_AND_JOIN_ROOM
3. ESTABLISH_SOCKET_CONNECTION
4. JOIN_ROOM_AND_INIT
5. JOIN_ROOM

During room join, the client gathers Plex player data through:
- plexclients/FETCH_JOIN_PLAYER_DATA

After joining, the client starts the Plex client poller and syncs media/player state.

## Client-side socket events

Socket event registration is centralized in:
- src/store/modules/synclounge/actions.js

The relevant action is:
- ADD_EVENT_HANDLERS

Current handled events include:
- userJoined
- userLeft
- newHost
- newMessage
- slPing
- playerStateUpdate
- mediaUpdate
- syncFlexibilityUpdate
- setPartyPausingEnabled
- setAutoHostEnabled
- partyPause
- disconnect
- connect
- kicked

## Plex library browsing

Main file:
- src/views/PlexLibrary.vue

Library browsing flow:
1. PlexLibrary.vue
2. FETCH_LIBRARY_CONTENTS
3. FETCH_LIBRARY_ALL
4. FETCH_PLEX_SERVER
5. Plex API path /library/sections/:sectionId/all

Relevant store file:
- src/store/modules/plexservers/actions.js

FETCH_PLEX_SERVER gets the selected Plex server connection URI from Vuex state and calls Plex directly.

## Server-side socket implementation

The current socket server is maintained in the vendored `packages/syncloungeserver` package.

Important source files:
- packages/syncloungeserver/src/socketserver/index.js
- packages/syncloungeserver/src/socketserver/actions.js
- packages/syncloungeserver/src/socketserver/handlers.js
- packages/syncloungeserver/src/socketserver/state.js

Generated server build output is committed under `packages/syncloungeserver/dist`. When server source changes, update and commit the matching generated files. Do not edit `node_modules` directly for project changes.

Current server-side socket events include:
- join
- slPong
- playerStateUpdate
- mediaUpdate
- syncFlexibilityUpdate
- transferHost
- sendMessage
- setPartyPausingEnabled
- setAutoHostEnabled
- partyPause
- disconnect
- kick

## Server-side room state

Server-side state currently uses in-memory Maps:
- rooms
- socketRoomId
- socketLatencyData

A room currently stores:
- isPartyPausingEnabled
- isAutoHostEnabled
- hostId
- users

The first user to create or join a room becomes host.

Users are stored by socket id.

The server updates playback/media state and broadcasts changes to the room.

## Health endpoint

The health response is based on joined user count:
- fewer than 25 joined users: low
- fewer than 50 joined users: medium
- 50 or more joined users: high

Expected local health response:
- {"load":"low"}

## Sync-A-Rama feature pattern

Sync-A-Rama features follow the existing socket pattern:
1. Client emits a room event.
2. Server validates room/user/host permissions.
3. Server updates in-memory room state.
4. Server broadcasts updated state to the room.
5. Clients render the updated state.

## Current implementation checkpoint

As of the current Sync-A-Rama fork, the app has moved beyond basic SyncLounge rebranding and now includes a working Sync-A-Rama host workflow.

Implemented pieces:

- Sync-A-Rama branding in the app header, browser title, visible room copy, local server label, Plex product header, and built-in web player label.
- A Sync-A-Rama panel with nominations, playlist management, and host/controller controls.
- Plex search-based nominations for movies, shows, and episodes.
- Playlist support for movies and episodes, including add, remove, reorder, clear, visibility, and active item state.
- Playlist visibility modes:
  - private
  - next item only
  - public
- Host-only playlist control over the socket room state.
- Server-backed Sync-A-Rama room state in the vendored syncloungeserver package.
- Broadcast of Sync-A-Rama state to room participants through `movieNightState`.
- Active playlist item tracking, including cleanup when the active item is removed or the playlist is cleared.
- Optional playlist auto-play when a media item naturally ends.
- Manual stop remains separate from natural media end, so pressing Stop does not auto-advance the playlist.
- A host controller browser mode opened with `controller=1`.
- Controller windows do not join as additional room participants.
- Controller actions are routed through the real host/player window using BroadcastChannel.
- The controller can manage nominations, manage the playlist, change playlist settings, and trigger playback through the host window.
- Room state smoke coverage exists in `scripts/check-syncarama-socket-state.sh`.

Important compatibility notes:

- The Vuex module namespace `synclounge` remains unchanged for now.
- Config keys such as `synclounge_upnext_trigger_time_from_end` remain unchanged for compatibility.
- Package names such as `syncloungeserver` and `synclounge-libjass` remain unchanged.
- Documentation should reference SyncLounge when describing upstream architecture, compatibility names, package names, or the fork relationship; normal user-facing product docs should present the app as Sync-A-Rama.

## Operator branding configuration

No branding environment variables are required. With no branding variables set,
Sync-A-Rama remains fully branded as Sync-A-Rama: the canonical name is
`Sync-A-Rama`, the current bundled legacy branding asset is used, branding names are visible in
all controlled locations, and the browser title resolves to `Sync-A-Rama` after
runtime config loads.

Common branding settings:

- `BRANDING_NAME`: optional canonical instance name. Empty or whitespace-only
  values fall back to `Sync-A-Rama`. This name also controls the browser tab
  title, even when visible branding text is hidden.
- `BRANDING_IMAGE_URL`: optional custom branding image URL. Empty or
  whitespace-only values use the current bundled legacy branding asset.
- `BRANDING_FAVICON_URL`: optional browser favicon URL. Empty or whitespace-only
  values retain the current bundled favicon.
- `BRANDING_SHOW_NAME`: optional global control for separately rendered branding
  text. Supported Boolean values include `true`, `false`, `1`, `0`, `"true"`,
  `"false"`, `"1"`, and `"0"`. It defaults to `true`.

Advanced location overrides:

- `BRANDING_TOP_BAR_SHOW_NAME`: controls the persistent top application bar.
- `BRANDING_SIGN_IN_SHOW_NAME`: controls the Plex sign-in screen.
- `BRANDING_ROOM_JOIN_SHOW_NAME`: controls the normal room/invite joining screen.
- `BRANDING_ROOM_CREATION_SHOW_NAME`: controls the normal room creation/connect
  screen.
- `BRANDING_ADVANCED_JOIN_SHOW_NAME`: controls the advanced joining flow,
  including client selection, server joining, and the advanced room walkthrough.

Location overrides inherit from `BRANDING_SHOW_NAME`. Empty, whitespace-only, or
unrecognized location override values inherit rather than forcing either `true`
or `false`. If `BRANDING_SHOW_NAME` is empty, unset, or unrecognized, it resolves
to `true`.

Custom branding images may be square icons or wide combined logo/wordmark images.
Sync-A-Rama preserves the image aspect ratio while constraining the image to the
available UI space. Full-page branding locations use a larger responsive image
limit, while the persistent top bar remains compact; there is no operator-facing
image-dimension configuration.

Planned beta image after publishing:

```yaml
services:
  syncarama:
    # Planned image; publish ghcr.io/codegreer/syncarama:beta before using this example.
    image: ghcr.io/codegreer/syncarama:beta
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
