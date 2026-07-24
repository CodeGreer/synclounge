# Sync-A-Rama Roadmap

This roadmap records product direction rather than fixed release dates. Priorities may change as beta testing reveals reliability, usability, and deployment needs.

## Current status

Sync-A-Rama is currently a Plex-backed beta focused on reliable weekly group movie nights.

The current beta includes synchronized playback, Host Controller support, Auto-Host, nominations, approval and runoff voting, and host-managed playlists.

Plex is the only implemented media-server backend today.

## Near-term beta priorities

- Stabilize the existing Plex-backed experience through real group testing.
- Fix playback, synchronization, host-transfer, voting, and playlist regressions.
- Complete release packaging, operator documentation, and final visual branding.
- Define practical beta and stable-release checkpoints.
- Keep shared room and synchronization behavior separate from backend-specific code where feasible.

## Media-server backend direction

Sync-A-Rama is intended eventually to support these selectable media-server backends:

- Plex
- Jellyfin
- Emby

Jellyfin and Emby are planned first-class backends, not merely possible third-party integrations. They are not implemented yet, and this roadmap does not assign them a release date.

Backend-specific responsibilities should progressively be isolated behind shared interfaces or adapters. These responsibilities include:

- authentication and user identity
- server discovery and connection
- library browsing and search
- media metadata and identifiers
- artwork and image URLs
- playback commands
- player-state polling and reporting
- capability detection
- backend-specific errors

Common room state, synchronization, nominations, voting, playlists, and host-transfer behavior should remain backend-neutral wherever practical.

## Planned progression

A likely development sequence is:

1. Continue stabilizing the current Plex implementation.
2. Identify and document the existing Plex-specific boundaries.
3. Move Plex behavior behind clearer backend interfaces without changing user-visible behavior.
4. Add Jellyfin support through the shared backend model.
5. Add Emby support through the shared backend model.

The exact order of Jellyfin and Emby implementation may change based on technical findings and contributor interest.

## Shared libraries and source access

Sync-A-Rama may be used with any number of media servers and libraries that have already been shared with the group through the backend's normal account, permission, and library-sharing system.

Sync-A-Rama does not create, broker, or temporarily grant library access during a group session. Access must be configured through Plex, Jellyfin, Emby, or the applicable backend beforehand.

Each selected item has an originating server and library. The supported playback model assumes that every participant can access that originating source.

Adding Jellyfin or Emby support means allowing shared sources to be provided through those backends. It does not by itself commit Sync-A-Rama to a decentralized room model in which every participant routinely uses an unrelated private backend.

## Exploratory fallback matching

The inherited Plex client currently makes a best-effort attempt to find a matching copy on another Plex server already available to a participant when the originating item cannot be used.

The current matcher searches by title and applies a basic heuristic using title, parent title, grandparent title, and media type. It has no documented confidence threshold or dedicated regression coverage, and its reliability has not been established in group use.

This fallback is therefore an unsupported safety net rather than a promised capability. Sync-A-Rama may evaluate whether it can be made reliable enough to improve, but only if real beta experience demonstrates sufficient value. No implementation effort or cross-backend fallback support is currently committed.

## Compatibility and scope

Existing internal SyncLounge and MovieNight compatibility identifiers do not prevent this roadmap. They should be migrated only through deliberate compatibility work rather than broad renaming.

Planned support does not mean that every backend will expose identical capabilities. Sync-A-Rama may need to document backend-specific limitations while maintaining consistent room behavior whenever possible.
