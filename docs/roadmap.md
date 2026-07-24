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
6. Support mixed-backend rooms where participants using different systems can match and play equivalent media.

The exact order of Jellyfin and Emby implementation may change based on technical findings and contributor interest.

## Mixed-backend rooms

The long-term goal includes rooms whose participants may use Plex, Jellyfin, or Emby independently.

This will require a backend-neutral media identity and matching strategy. A title existing on multiple servers cannot be assumed to share the same native identifier, file path, edition, runtime, or metadata.

Mixed-backend support is therefore a later capability, separate from simply allowing an entire room to select Jellyfin or Emby instead of Plex.

## Compatibility and scope

Existing internal SyncLounge and MovieNight compatibility identifiers do not prevent this roadmap. They should be migrated only through deliberate compatibility work rather than broad renaming.

Planned support does not mean that every backend will expose identical capabilities. Sync-A-Rama may need to document backend-specific limitations while maintaining consistent room behavior whenever possible.
