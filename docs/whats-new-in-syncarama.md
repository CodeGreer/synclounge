# What's New in Sync-A-Rama Compared to SyncLounge

Sync-A-Rama is a fork, rebrand, and extension of SyncLounge. It preserves the core SyncLounge idea of synchronized Plex playback in shared rooms, then adds group decision-making and host workflow tools for weekly movie nights.

SyncLounge focused primarily on helping people watch Plex media together in sync. Sync-A-Rama builds around that playback experience by adding nomination, voting, playlist, and host-control features so a group can decide what to watch, line up media, and manage playback from a clearer host workflow.

This document is for regular participants, hosts/operators, testers, and people already familiar with SyncLounge who need to understand what Sync-A-Rama adds without assuming it is a production-ready replacement for every SyncLounge use case.

## What is intentionally unchanged from SyncLounge

Sync-A-Rama still depends on several important SyncLounge-era assumptions:

- Plex authentication is still required.
- Participants still need Plex credentials.
- Participants still need access to the relevant Plex server and library.
- Synchronized playback still relies on the SyncLounge room and socket model.
- Some internal package names, configuration keys, paths, and implementation details may still say `SyncLounge`.

Do not treat remaining internal `SyncLounge` names as automatically wrong. Sync-A-Rama is still built on the SyncLounge architecture and preserves upstream SyncLounge attribution.


## Public room trust boundary

Sync-A-Rama intentionally keeps the upstream SyncLounge public-room model for beta: a room URL should be treated as joinable by anyone who knows or guesses the room name. Plex login still controls access to Plex accounts, servers, and libraries, but the room socket server does not treat the browser client as trusted just because the user reached a room.

The server now applies Sync-A-Rama-specific safety limits before rebroadcasting shared room state. Nominations and playlist items are whitelisted and trimmed, unknown fields are ignored, malformed items are rejected, nominations and playlist arrays are capped at 100 items each, active polls are capped at 50 options, and votes must reference current poll option IDs. Sync-A-Rama mutating socket actions and chat messages also have generous per-socket fixed-window rate limits to reduce accidental or malicious spam. Chat messages are trimmed, capped, and treated as plain text.

These caps and rate limits protect nomination, poll, vote, playlist, and chat state from unbounded growth in public-room beta use. They are not a replacement for full server-side Plex authorization or token validation, which remains out of scope for the current beta architecture.

The beta server also intentionally allows cross-origin HTTP and Socket.IO access for self-hosted deployments, alternate LAN hostnames, and reverse-proxy setups. This CORS policy is a compatibility choice, not an authentication boundary; room names and room URLs should still be treated as shareable access paths rather than private secrets.

## New Sync-A-Rama UX elements

### Sync-A-Rama panel

The Sync-A-Rama panel is the main in-room surface for the added Sync-A-Rama workflow. It brings nominations, polls, voting status, playlist controls, and current selection context into the shared room experience.

- **Problem it solves:** Gives the group one place to manage the "what should we watch?" flow instead of relying only on chat or out-of-band discussion.
- **Who uses it:** Hosts and guests use it during the selection process. Hosts may use additional controls when they are managing the room.
- **What guests should expect:** Guests should see the current selection state, available actions, nominations, voting prompts, and playlist information according to the current room settings.
- **What hosts should expect:** Hosts should see the workflow controls needed to guide the group from nominations through voting and into playback.

### Host Controller

The Host Controller is a host-only control surface paired with the host's main player window. It is not a separate room participant, is not eligible to become host, and should not appear in the attendee list.

- **Problem it solves:** Lets the host browse and manage Sync-A-Rama controls from a separate controller window without turning that controller into another participant or playback identity.
- **Who uses it:** The active host/operator.
- **What guests should expect:** Guests should not need the Host Controller. They should continue using the normal room and Sync-A-Rama panel.
- **What hosts should expect:** The Host Controller should feel like a remote control for the paired host/player window, not like a second user in the room.

### Nominations

Nominations let participants suggest movies, episodes, or shows/series for the group to consider. Movies and episodes are playable playlist items; shows/series can be nominated for discussion or selection context, but are not directly playable playlist items.

- **Problem it solves:** Replaces ad hoc suggestions with a visible shared list of candidates.
- **Who uses it:** Guests and hosts can use nominations during the selection phase.
- **What guests should expect:** Guests should be able to add suggestions and see what others have proposed.
- **What hosts should expect:** Hosts should be able to use nominations as the candidate pool for voting and playlist decisions.

### Approval voting

Approval voting lets participants approve any number of nominated items they would be willing to watch.

- **Problem it solves:** Captures broad acceptability better than asking each person for only one favorite.
- **Who uses it:** Guests and hosts vote on nominated items when a poll is open.
- **What guests should expect:** Guests can approve multiple acceptable choices, not just one.
- **What hosts should expect:** Hosts can use approval totals to understand which options have the most group support.

### Runoff voting

Runoff voting narrows the field from top approval results into a smaller follow-up decision.

- **Problem it solves:** Helps resolve close or crowded nomination results when approval voting produces multiple viable options.
- **Who uses it:** Hosts start or manage the runoff; guests and hosts participate by voting in the runoff.
- **What guests should expect:** Guests may be asked to vote again among a smaller set of finalists.
- **What hosts should expect:** Hosts should use runoff voting when the first round needs a clearer final choice.

### Host playlist

The host playlist is the ordered list of playable Sync-A-Rama items the host can prepare for the room.

- **Problem it solves:** Lets the host line up the selected movie or episode, and optionally additional items, before or during playback.
- **Who uses it:** The host manages the playlist. Guests may see some or all of it depending on visibility settings.
- **What guests should expect:** Guests should understand what is currently queued or playing when the playlist is visible to them.
- **What hosts should expect:** Hosts should be able to add playable items, manage order, and use the playlist as the bridge from group selection into synchronized playback.

### Playlist visibility modes

Playlist visibility modes control how much of the host playlist is visible to guests.

- **Problem it solves:** Lets hosts choose between transparency and surprise, depending on how the movie night is being run.
- **Who uses it:** Hosts configure visibility; guests experience the resulting level of playlist detail.
- **What guests should expect:** In some rooms, guests may see the playlist. In others, they may only see limited current-item information.
- **What hosts should expect:** Hosts should verify that the selected visibility mode matches the intended experience before relying on it during a session.

### Playlist auto-play

Playlist auto-play lets the host playlist advance through queued items automatically when enabled.

- **Problem it solves:** Reduces manual host work when the group wants a continuous lineup.
- **Who uses it:** Hosts enable or disable auto-play based on the room plan.
- **What guests should expect:** If auto-play is enabled, the next queued item may begin without a separate manual host action.
- **What hosts should expect:** Hosts should confirm auto-play is set the way they intend before playback reaches the end of an item.

### Active playlist item tracking

Active playlist item tracking marks which playlist item is currently active for the room.

- **Problem it solves:** Keeps the playlist, Sync-A-Rama panel, and playback context aligned so users can tell which queued item is currently in use.
- **Who uses it:** Hosts rely on it to manage playback state; guests use it to understand what is currently selected or playing.
- **What guests should expect:** The active item should help explain what the room is watching now.
- **What hosts should expect:** The active item should reflect the host's current playback workflow and help avoid confusion when multiple items are queued.

### Stale Host Controller warning and invalidation after host transfer

When host control transfers away from a user, that user's old Host Controller becomes stale. The stale controller should warn the user, hide or disable stale controls, and avoid changing room state.

- **Problem it solves:** Prevents an old controller window from appearing to control the room after its paired player is no longer host.
- **Who uses it:** Hosts and operators encounter this when host transfer happens.
- **What guests should expect:** Guests should see host transfer behave as a real participant-to-participant change, not as a controller becoming a participant.
- **What hosts should expect:** The old host's controller should become inactive after transfer. The new host should use their own normal room controls or Host Controller setup.

## Current beta limits

Sync-A-Rama is still in beta and should not be described as production-ready. Current limits include:

- Anonymous guests are not implemented.
- Local-only guest accounts are not implemented.
- Voting-only users are not implemented.
- Room, vote, and playlist state is not persisted after a server restart.
- Real multi-user UX issues are expected during beta testing.

Every beta participant must sign in with Plex credentials and must have access to the relevant Plex server and library.

## UX questions to watch during beta

During beta sessions, testers and hosts should watch for confusion around these questions:

- Do guests understand nominations?
- Do guests understand approval voting?
- Is runoff voting clear?
- Is playlist visibility understandable?
- Does auto-play behavior match host expectations?
- Is the Host Controller clearly host-only?
- Is stale controller behavior after host transfer clear?
- Do testers know what to report when something feels confusing?

## UX feedback prompts

When something feels confusing, testers can report it using these prompts:

- What felt confusing?
- What label or button did not make sense?
- What did you expect to happen?
- What happened instead?
- Were you host or guest?
- Were you using the Host Controller?
- Did host transfer happen?

Helpful reports include the room role, whether a Host Controller was open, what action was attempted, what the user expected, and what happened on screen. Screenshots or short screen recordings are useful when they do not expose private Plex account or server details.
