# MovieNight Architecture Notes

These notes describe the current SyncLounge architecture as observed in the MovieNight fork.

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

Current local SyncLounge server label:
- MovieNight Local

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

The current socket server comes from the installed syncloungeserver package.

Important files:
- node_modules/syncloungeserver/dist/socketserver/index.js
- node_modules/syncloungeserver/dist/socketserver/actions.js
- node_modules/syncloungeserver/dist/socketserver/handlers.js
- node_modules/syncloungeserver/dist/socketserver/state.js

Do not edit node_modules directly for real project changes.

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

## MovieNight feature implications

Future MovieNight features should probably follow the existing socket pattern:
1. Client emits a room event.
2. Server validates room/user/host permissions.
3. Server updates in-memory room state.
4. Server broadcasts updated state to the room.
5. Clients render the updated state.

Good future event candidates:
- addCandidate
- removeCandidate
- startVote
- castVote
- endVote
- clearVote
- startGameRound
- submitGameAnswer

Because the current server-side code lives inside node_modules/syncloungeserver, we need to choose a clean extension strategy before adding server-side MovieNight state.

Possible strategies:
1. Fork or vendor syncloungeserver into this repo.
2. Add a local wrapper or extension server layer.
3. Replace the package with project-owned socket server code.

Do not choose this yet. First, continue mapping the current app and identify the least invasive path.
