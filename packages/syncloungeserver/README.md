# MovieNight Socket Server Package Notes

This package is still named `syncloungeserver` for compatibility with the inherited SyncLounge architecture and package layout. Do not rename the package as part of documentation cleanup.

MovieNight currently uses this server package for the room/socket layer that supports synchronized Plex playback plus MovieNight room state such as nominations, approval polls, runoffs, playlist state, playlist visibility, playlist auto-play, active playlist item tracking, and host-only actions.

## Fork relationship

MovieNight is a SyncLounge fork/rebrand/extension. The server package name, binary name, and some command examples still use `syncloungeserver` because they are technical package interfaces, not user-facing product branding.

## Usage

Default port is `8088` unless overridden.

```sh
syncloungeserver
```

Override the port with an argument or environment variable:

```sh
syncloungeserver --port 1234
PORT=1234 syncloungeserver
```

Serve a built web app with `STATIC_PATH` or `--static_path`:

```sh
syncloungeserver --static_path /path/to/movienight/dist
STATIC_PATH='/path/to/movienight/dist' syncloungeserver
```

Set a base URL when reverse proxying under a subpath:

```sh
syncloungeserver --base_url '/somebase'
BASE_URL='/somebase' syncloungeserver
```

Set ping interval:

```sh
syncloungeserver --ping_interval 10000
PING_INTERVAL=10000 syncloungeserver
```

## Development build

```sh
npm install
npm run build
npm run start
```

When server source under `packages/syncloungeserver/src` changes, commit both the source files and generated files under `packages/syncloungeserver/dist`.

## Beta constraints

The current MovieNight beta still requires Plex authentication. Participants need Plex credentials and access to the relevant Plex server/library. Anonymous, local-only, and voting-only users are not implemented.

## Upstream attribution and license

This package descends from the SyncLounge socket server and retains the inherited MIT license. See the repository `LICENSE.txt` file.

MovieNight and SyncLounge are in no way affiliated with Plex Inc.
