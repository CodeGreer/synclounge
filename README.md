# Sync-A-Rama

Sync-A-Rama is a Plex-backed group movie-night app built as a fork, rebrand, and extension of [SyncLounge](https://github.com/synclounge/synclounge). It keeps the core SyncLounge idea of syncing Plex playback across multiple participants, while adding room workflows for choosing and managing what the group watches.

Sync-A-Rama still intentionally uses several SyncLounge internals, package names, and configuration keys. Those names are compatibility details and are not by themselves stale branding.

## Current status

Sync-A-Rama is in beta-oriented development. It is usable for Plex-authenticated group testing, but it is not a replacement for every upstream SyncLounge deployment pattern yet.

### Implemented Sync-A-Rama features

- **Host Controller**: the host can open a separate controller/browser window while the main player window keeps playback and room identity.
- **Nominations**: participants can nominate Plex movies, shows, or episodes.
- **Approval voting**: the host can start a vote from nominations; participants can approve any candidates they would watch.
- **Runoff voting**: after a closed vote, the host can start a runoff from the top 2, 3, or 5 results.
- **Host playlist**: hosts can build and manage a room-backed playlist.
- **Playlist visibility**: playlist visibility supports private, next item only, and public modes.
- **Playlist auto-play**: optional auto-play advances to the next playlist item after natural media end.
- **Active playlist item tracking**: the room tracks the active playlist item and clears stale active state when items are removed or the playlist is cleared.
- **Stale Host Controller invalidation**: when host control transfers away, the previous host's controller becomes inactive and stale controller commands must not change room state.

Movies and episodes are playable playlist items. Shows/series can be nominated but are not directly playable playlist items.

### Beta constraints

- Plex authentication is still required.
- Every participant needs Plex credentials.
- Every participant needs access to the relevant Plex server/library.
- Anonymous guests are not implemented.
- Local-only guest accounts are not implemented.
- Voting-only users are not implemented.
- Room state and votes are not persisted after a server restart.

## How it works

Sync-A-Rama uses the SyncLounge room/socket model for synchronized Plex playback:

1. Participants sign in with Plex.
2. Participants choose a Plex player, a Sync-A-Rama server, and a room.
3. The first participant to join normally becomes host.
4. Host playback commands are synced to the rest of the room.
5. Sync-A-Rama room state layers nominations, voting, playlist state, playlist visibility, and Host Controller commands on top of the existing room flow.

The main host/player window remains the real room participant and playback identity. The Host Controller window is a control surface only; it does not join as another room participant, does not appear in the attendee list, and is not eligible to become host.

## Documentation

- [Sync-A-Rama fork notes](README-SYNCARAMA.md)
- [Current implementation](docs/current-implementation.md)
- [Beta readiness checklist](docs/beta-readiness.md)
- [Selection sessions and voting](docs/selection-sessions.md)
- [Host Controller browser](docs/host-controller-browser.md)
- [Architecture notes](docs/syncarama-architecture-notes.md)

## Local development and beta smoke checks

The current dev environment commonly serves Sync-A-Rama on port `8092` while the underlying server package default remains `8088`.

Run the preferred beta checks from the repository root:

```sh
git status --short
git log --oneline -8
docker exec -it syncarama-dev sh -lc 'cd /workspace/syncarama && npm run build >/tmp/syncarama-build.log 2>&1; code=$?; tail -80 /tmp/syncarama-build.log; exit $code'
./scripts/check-syncarama-socket-state.sh
curl -s http://127.0.0.1:8092/health; echo
```

Expected successful output includes:

```text
DONE  Build complete. The dist directory is ready to be deployed.
PASS: Sync-A-Rama playlist and poll state synced to guest
{"load":"low"}
```

## Self-hosting notes

The root Dockerfile and package layout predate the Sync-A-Rama fork. They may still be useful for building the current checkout, but Docker packaging should not be assumed production-ready without testing image build, container startup, `/health`, browser loading, and socket smoke behavior.

Do not rename package names such as `synclounge` or `syncloungeserver` just for branding. They remain part of the current technical architecture.

By default, the server package listens on port `8088`. The beta dev environment commonly runs `node server.js --port 8092`, and deployments may map an external port to the container's internal port.

Environment variables can override defaults from `config/defaults.js`. Nested objects and arrays can be passed as JSON strings, for example:

```sh
AUTHENTICATION='{"mechanism":"plex","type":["server"],"authorized":["MACHINE_ID"]}'
SERVERS='[{"name":"My Server","location":"Mothership","url":"https://myserver.com","image":"https://myserver.com/myimage.jpg"}]'
```

### Reverse proxy example

Sync-A-Rama can be proxied to the running Node process. Keep WebSocket upgrade headers intact.

```nginx
map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      '';
}

server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name syncarama.example.com;

    location / {
        proxy_pass http://containeraddress:8088;
        proxy_http_version 1.1;
        proxy_socket_keepalive on;
        proxy_redirect off;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Sec-WebSocket-Extensions $http_sec_websocket_extensions;
        proxy_set_header Sec-WebSocket-Key $http_sec_websocket_key;
        proxy_set_header Sec-WebSocket-Version $http_sec_websocket_version;
    }
}
```


## Compatibility identifiers intentionally retained

The following identifiers are intentionally retained to avoid compatibility or protocol risk during this product rebrand:

- `synclounge` Vuex/module namespaces, the root binary compatibility path, and inherited SyncLounge configuration keys.
- The `syncloungeserver` package and binary name, plus upstream SyncLounge attribution in package docs.
- Socket event names and room-state fields such as `movieNightState` and `movieNight*` actions.
- MovieNight-specific component/module filenames, Vue component names, helper symbols, the `movienight` Vuex namespace, and `movienight-controller` BroadcastChannel names.
- The existing bundled `movienight-small-light.png` branding asset and current favicon remain temporary legacy assets until final Sync-A-Rama logo/favicon files are supplied.

## Upstream attribution

Sync-A-Rama is based on SyncLounge, previously PlexTogether. SyncLounge's original purpose was syncing Plex content across multiple players in multiple locations. Sync-A-Rama preserves that foundation while adding group selection and host-control workflows.

Original SyncLounge contributors listed in the inherited README included:

- [samcm](https://twitter.com/durksau) - Developer
- [gcordalis](https://twitter.com/gcordalis) - User Interface
- [ttshivers](https://github.com/ttshivers) - Developer
- [Brandz](https://twitter.com/homebrandz) - Design
- [TheGrimmChester](https://github.com/TheGrimmChester) - Developer/Tester
- [MagicalCodeMonkey](https://github.com/MagicalCodeMonkey) - Developer/Tester
- [Starbix](https://github.com/Starbix) - Docker Support
- kg6jay - Tester

## License

Sync-A-Rama retains the inherited MIT license. See `LICENSE`.

Sync-A-Rama and SyncLounge are in no way affiliated with Plex Inc.

This project uses [Material Design libraries](https://material.io/) provided under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode).
