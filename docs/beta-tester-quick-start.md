# Sync-A-Rama Beta Tester Quick Start

Sync-A-Rama is a shared movie-night app for choosing and watching Plex media together. It helps a group join the same room, nominate titles, vote on what to watch, build a host-managed playlist, and keep playback coordinated.

Sync-A-Rama is currently a fork, rebrand, and extension of SyncLounge. Some internal names and flows still come from SyncLounge, especially around Plex sign-in and synchronized playback.

Sync-A-Rama is in beta. Please treat it as a test version for coordinated movie nights, not as a finished production service.

## Current beta constraints

Before joining a beta session, make sure these constraints are clear to everyone:

- Plex authentication is required.
- Every participant needs their own Plex credentials.
- Every participant needs access to the relevant Plex server and library before the session starts.
- Anonymous guests are not implemented.
- Local-only guest accounts are not implemented.
- Voting-only users are not implemented.

If someone cannot sign in with Plex or cannot see the host's Plex library, they should expect trouble joining, nominating, voting on, or watching titles.

## Joining a room

1. Open the Sync-A-Rama link shared by the host.
2. Sign in with Plex when prompted.
3. Join the room name or room link provided by the host.
4. Confirm that you appear as a participant in the room.
5. Wait for the host to start nominations, voting, playlist actions, or playback.

If you join late, you may need to ask the host what stage the room is in. For example, the group may already be nominating titles, voting, watching a playlist item, or preparing a runoff vote.

## Host and guest roles

Sync-A-Rama has one active host at a time.

The host can:

- Guide the room through nominations and voting.
- Start, close, clear, or run off votes.
- Add playable titles to the playlist.
- Reorder, remove, or clear playlist items.
- Choose playlist visibility and auto-play settings.
- Start playback for the group.

Guests can:

- Join the room as normal participants.
- Nominate available Plex titles.
- Vote while a vote is open.
- Watch and sync playback with the room.

Host control can transfer between real room participants. If that happens, the previous host is no longer the active host, and the new host becomes responsible for host-only actions.

## Host Controller

The Host Controller is a separate control window for the current host. It is meant to let the host browse, nominate, vote-manage, and playlist-manage without interrupting the main host/player window.

Only the active host should use the Host Controller because:

- It is a control surface for the host, not a guest view.
- It is not a room participant.
- It should not appear in the attendee list.
- It sends commands through the host's main player window.
- The main host/player window must stay open for the controller to work.

If host control transfers to another participant, the old host's controller should become inactive. Stale controller controls should not be used to change room state.

## Nominations

Nominations are the group's suggested titles for the session.

During nominations:

1. Participants search or browse available Plex content.
2. Participants nominate titles they would be willing to watch.
3. The room builds a shared nomination list.
4. The host can use that list to start an approval vote.

Movies and episodes are intended to be playable playlist items. Shows or series may appear as nominations, but they are not directly playable playlist items in the same way as a specific movie or episode.

## Approval voting

Sync-A-Rama currently uses approval voting.

In an approval vote:

1. The host starts a vote from the current nominations.
2. Each participant approves any titles they would be happy watching.
3. Participants may approve more than one title.
4. Participants can change their approvals while the vote is open.
5. The host closes the vote.
6. Sync-A-Rama shows the result, such as a winner, a tie, or no approved titles.

Approval voting is useful when the group wants to find every title people would accept, not just each person's single favorite.

## Runoff voting

A runoff is a follow-up vote created from the top results of a closed vote.

The host may start a runoff when:

- The first vote has several strong options.
- There is a tie.
- The group wants to narrow the list before choosing.

A runoff starts a new voting round from selected top results, such as the top 2, top 3, or top 5. Previous votes do not carry over into the new round, so participants should vote again.

## Playlist visibility and auto-play

The host can build a playlist from playable nominations or vote results.

At a high level:

- Playlist visibility controls how much of the playlist is shown to participants.
- Auto-play controls whether Sync-A-Rama should try to move to the next playlist item automatically.
- The active playlist item shows what the room is currently watching or preparing to watch.

For beta sessions, pay attention to whether playlist visibility is understandable and whether auto-play behaves the way the group expects. If the host manually stops playback, report whether Sync-A-Rama unexpectedly advances or stays stopped.

## What to test during a beta session

During a beta movie night, please try the normal group flow and watch for confusing or broken behavior.

Useful things to test:

- Signing in with Plex.
- Joining the host's room.
- Confirming every participant can see the expected Plex library content.
- Nominating movies, episodes, and shows.
- Removing or changing nominations if the host asks you to test that flow.
- Starting an approval vote.
- Approving and unapproving multiple titles while the vote is open.
- Closing a vote and understanding the result.
- Running a runoff from the top results.
- Adding a winning or tied title to the playlist.
- Showing, hiding, or otherwise changing playlist visibility.
- Turning playlist auto-play on and off.
- Watching whether playback stays synced.
- Transferring host control between real participants, if the group is intentionally testing that behavior.
- Confirming the old host's Host Controller becomes inactive after host transfer.

Do not test by trying to bypass Plex sign-in or by inviting anonymous guests. Those flows are not implemented in the current beta.

## Reporting a bug

When reporting a bug, include enough detail for someone else to understand what happened and try to reproduce it.

Please capture:

- Date and approximate time of the session.
- Room name or room link used, if safe to share with the maintainer.
- Whether you were the host or a guest.
- Whether you were using the main Sync-A-Rama window or the Host Controller.
- Browser and device type.
- The title or playlist item involved.
- What you expected to happen.
- What actually happened.
- Steps to reproduce the problem.
- Screenshots or screen recordings, if available.
- Any visible error messages.
- Whether refreshing the page, rejoining the room, or signing in again changed the behavior.
- Whether other participants saw the same issue.

Avoid sharing Plex passwords, private tokens, or screenshots that expose sensitive account information.

## Copy/paste beta feedback template

```text
Sync-A-Rama beta feedback

Session date/time:
Your role: Host / Guest
Window used: Main Sync-A-Rama window / Host Controller / Both
Browser and device:
Room name or link, if safe to share:

What were you trying to do?


What happened?


What did you expect to happen?


Steps to reproduce:
1.
2.
3.

Plex/library context:
- Could you sign in with Plex? Yes / No
- Could you see the expected Plex library? Yes / No
- Were other participants affected? Yes / No / Not sure

Sync-A-Rama feature involved:
- Joining
- Nominations
- Approval voting
- Runoff voting
- Playlist
- Auto-play
- Playback sync
- Host Controller
- Host transfer
- Other:

Screenshots, recordings, or error messages:


Did refreshing, rejoining, or signing in again help?


Anything else that felt confusing or surprising?

```
