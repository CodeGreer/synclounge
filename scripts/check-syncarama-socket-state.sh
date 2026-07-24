#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:8092}"
ROOM_ID="${ROOM_ID:-SYNCARAMA_SMOKE_$(date +%s)}"

docker exec -e APP_URL="$APP_URL" -e ROOM_ID="$ROOM_ID" movienight-dev sh -lc '
cd /workspace/movienight

node <<\NODE
const io = require("socket.io-client");

const appUrl = process.env.APP_URL;
const roomId = process.env.ROOM_ID;
const autoHostRoomId = `${roomId}_AUTO_HOST`;

const itemOne = {
  source: "plex",
  playlistKey: "plex:smoke-server:smoke-rating-key-1",
  nominationKey: "plex:smoke-server:smoke-rating-key-1",
  title: "Sync-A-Rama Smoke Test One",
  year: 2026,
  type: "movie",
  ratingKey: "smoke-rating-key-1",
  key: "/library/metadata/smoke-rating-key-1",
  machineIdentifier: "smoke-server",
  thumb: "/library/metadata/smoke-rating-key-1/thumb",
  art: "/library/metadata/smoke-rating-key-1/art",
  duration: 60000,
};

const itemTwo = {
  source: "plex",
  playlistKey: "plex:smoke-server:smoke-rating-key-2",
  nominationKey: "plex:smoke-server:smoke-rating-key-2",
  title: "Sync-A-Rama Smoke Test Two",
  year: 2026,
  type: "movie",
  ratingKey: "smoke-rating-key-2",
  key: "/library/metadata/smoke-rating-key-2",
  machineIdentifier: "smoke-server",
  thumb: "/library/metadata/smoke-rating-key-2/thumb",
  art: "/library/metadata/smoke-rating-key-2/art",
  duration: 70000,
};

const sockets = [];
const timers = new Set();
let latestState = null;

const fail = (message) => {
  console.error("FAIL:", message);
  cleanup();
  process.exit(1);
};

const pass = (message) => {
  console.log("PASS:", message);
  cleanup();
  process.exit(0);
};

const cleanup = () => {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
  sockets.forEach((socket) => {
    socket.removeAllListeners();
    socket.close();
  });
};

const waitForState = (label, predicate) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    timers.delete(timeout);
    reject(new Error("Timed out waiting for " + label));
  }, 10000);
  timers.add(timeout);

  const check = (state) => {
    if (!predicate(state)) {
      return;
    }

    clearTimeout(timeout);
    timers.delete(timeout);
    resolve(state);
  };

  if (latestState) {
    check(latestState);
  }

  stateWaiters.push(check);
});

const stateWaiters = [];

const waitForEvent = (socket, eventName, label, predicate = () => true) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    socket.off(eventName, handler);
    timers.delete(timeout);
    reject(new Error("Timed out waiting for " + label));
  }, 10000);
  timers.add(timeout);

  const handler = (data) => {
    if (!predicate(data)) {
      return;
    }

    clearTimeout(timeout);
    timers.delete(timeout);
    socket.off(eventName, handler);
    resolve(data);
  };

  socket.on(eventName, handler);
});

const mediaPayload = ({ mediaId, userInitiated } = {}) => {
  const payload = {
    state: "playing",
    time: 1000,
    duration: 60000,
    playbackRate: 1,
    media: {
      source: "plex",
      title: `Auto-Host Regression ${mediaId}`,
      type: "movie",
      ratingKey: mediaId,
      key: `/library/metadata/${mediaId}`,
      machineIdentifier: "smoke-server",
    },
  };

  if (userInitiated !== undefined) {
    payload.userInitiated = userInitiated;
  }

  return payload;
};

const assertCondition = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const joinSocket = ({ username, room = roomId, desiredAutoHostEnabled = false }) => new Promise((resolve, reject) => {
  const socket = io(appUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  sockets.push(socket);

  socket.on("connect_error", reject);

  socket.once("slPing", (secret) => {
    socket.emit("slPong", secret);
    socket.emit("join", {
      roomId: room,
      desiredUsername: username,
      desiredPartyPausingEnabled: true,
      desiredAutoHostEnabled,
      thumb: null,
      playerProduct: "syncarama-smoke-test",
      state: "stopped",
      time: 0,
      duration: 0,
      playbackRate: 1,
      media: null,
      syncFlexibility: 3000,
    });
  });

  socket.once("joinResult", (data) => {
    if (!data.success) {
      reject(new Error(data.error || "join failed"));
      return;
    }

    socket.joinResult = data;
    resolve(socket);
  });
});

const connectUnjoinedSocket = () => new Promise((resolve, reject) => {
  const socket = io(appUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  sockets.push(socket);
  socket.on("connect_error", reject);
  socket.once("slPing", (secret) => {
    socket.emit("slPong", secret);
    resolve(socket);
  });
});

const delay = (ms) => new Promise((resolve) => {
  const timeout = setTimeout(() => {
    timers.delete(timeout);
    resolve();
  }, ms);
  timers.add(timeout);
});

(async () => {
  const unjoined = await connectUnjoinedSocket();
  let unjoinedDisconnected = false;
  unjoined.once("disconnect", () => {
    unjoinedDisconnected = true;
  });
  unjoined.emit("autoHostIntent");
  await delay(250);
  assertCondition(!unjoinedDisconnected, "Unjoined autoHostIntent should be ignored without disconnecting");

  const host = await joinSocket({ username: "SyncaramaSmokeHost" });
  const guest = await joinSocket({ username: "SyncaramaSmokeGuest" });

  guest.on("movieNightState", (state) => {
    latestState = state;
    stateWaiters.slice().forEach((check) => check(state));
  });

  host.emit("movieNightAddNomination", itemOne);
  await waitForState("first nomination", (state) => (
    state.nominations.length === 1
    && state.nominations[0].nominationKey === itemOne.playlistKey
  ));

  host.emit("movieNightAddNomination", itemTwo);
  const nominationState = await waitForState("second nomination", (state) => (
    state.nominations.length === 2
    && state.nominations[1].nominationKey === itemTwo.playlistKey
  ));

  host.emit("movieNightStartApprovalPollFromNominations");
  const pollState = await waitForState("approval poll open", (state) => (
    state.activePoll
    && state.activePoll.status === "open"
    && state.activePoll.mode === "approval"
    && state.activePoll.candidates.length === 2
  ));

  const firstCandidateId = pollState.activePoll.candidates[0].id;

  guest.emit("movieNightSetPollApproval", {
    candidateId: firstCandidateId,
    approved: true,
  });

  await waitForState("guest poll approval", (state) => (
    state.activePoll
    && state.activePoll.votesBySocketId
    && state.activePoll.votesBySocketId[guest.id]
    && state.activePoll.votesBySocketId[guest.id].some(
      (candidateId) => String(candidateId) === String(firstCandidateId),
    )
  ));

  guest.emit("movieNightSetPollApproval", {
    candidateId: firstCandidateId,
    approved: false,
  });

  await waitForState("guest poll approval removed", (state) => (
    state.activePoll
    && (
      !state.activePoll.votesBySocketId[guest.id]
      || state.activePoll.votesBySocketId[guest.id].length === 0
    )
  ));

  guest.emit("movieNightSetPollApproval", {
    candidateId: firstCandidateId,
    approved: true,
  });

  await waitForState("guest poll approval restored", (state) => (
    state.activePoll
    && state.activePoll.votesBySocketId
    && state.activePoll.votesBySocketId[guest.id]
    && state.activePoll.votesBySocketId[guest.id].some(
      (candidateId) => String(candidateId) === String(firstCandidateId),
    )
  ));

  host.emit("movieNightClosePoll");
  await waitForState("approval poll closed", (state) => (
    state.activePoll
    && state.activePoll.status === "closed"
    && state.activePoll.closedAt
  ));

  host.emit("movieNightStartPollRunoff", { limit: 2 });
  const runoffState = await waitForState("approval poll runoff open", (state) => (
    state.activePoll
    && state.activePoll.status === "open"
    && state.activePoll.source === "runoff"
    && state.activePoll.sourcePollId
    && state.activePoll.round === 2
    && state.activePoll.candidates.length === 2
    && Object.keys(state.activePoll.votesBySocketId || {}).length === 0
  ));

  const runoffCandidateId = runoffState.activePoll.candidates[0].id;

  guest.emit("movieNightSetPollApproval", {
    candidateId: runoffCandidateId,
    approved: true,
  });

  await waitForState("guest runoff approval", (state) => (
    state.activePoll
    && state.activePoll.votesBySocketId
    && state.activePoll.votesBySocketId[guest.id]
    && state.activePoll.votesBySocketId[guest.id].some(
      (candidateId) => String(candidateId) === String(runoffCandidateId),
    )
  ));

  host.emit("movieNightClosePoll");
  await waitForState("approval poll runoff closed", (state) => (
    state.activePoll
    && state.activePoll.status === "closed"
    && state.activePoll.source === "runoff"
    && state.activePoll.closedAt
  ));

  host.emit("movieNightClearPoll");
  await waitForState("approval poll cleared", (state) => (
    state.activePoll === null
  ));

  host.emit("movieNightAddPlaylistItem", itemOne);
  await waitForState("first playlist item", (state) => (
    state.playlist.length === 1
    && state.playlist[0].playlistKey === itemOne.playlistKey
  ));

  host.emit("movieNightAddPlaylistItem", itemTwo);
  const twoItemState = await waitForState("second playlist item", (state) => (
    state.playlist.length === 2
    && state.playlist[1].playlistKey === itemTwo.playlistKey
  ));

  host.emit("movieNightMovePlaylistItemUp", twoItemState.playlist[1].id);
  await waitForState("playlist reorder", (state) => (
    state.playlist.length === 2
    && state.playlist[0].playlistKey === itemTwo.playlistKey
  ));

  host.emit("movieNightSetPlaylistVisibility", "public");
  await waitForState("playlist visibility", (state) => (
    state.playlistVisibility === "public"
  ));

  host.emit("movieNightSetPlaylistAutoPlay", true);
  await waitForState("playlist auto-play", (state) => (
    state.playlistAutoPlay === true
  ));

  host.emit("movieNightSetActivePlaylistItem", latestState.playlist[0]);
  await waitForState("active playlist item", (state) => (
    state.activePlaylistItem
    && state.activePlaylistItem.playlistKey === itemTwo.playlistKey
  ));

  host.emit("movieNightSetActivePlaylistItem", null);
  await waitForState("active playlist item clear", (state) => (
    state.activePlaylistItem === null
  ));

  host.emit("movieNightSetActivePlaylistItem", latestState.playlist[0]);
  await waitForState("active playlist item reset", (state) => (
    state.activePlaylistItem
    && state.activePlaylistItem.playlistKey === itemTwo.playlistKey
  ));

  host.emit("movieNightRemovePlaylistItem", latestState.playlist[0].id);
  await waitForState("playlist remove preserves active item", (state) => (
    state.playlist.length === 1
    && state.playlist[0].playlistKey === itemOne.playlistKey
    && state.activePlaylistItem
    && state.activePlaylistItem.playlistKey === itemTwo.playlistKey
  ));

  host.emit("movieNightSetActivePlaylistItem", latestState.playlist[0]);
  await waitForState("active playlist item before clear", (state) => (
    state.activePlaylistItem
    && state.activePlaylistItem.playlistKey === itemOne.playlistKey
  ));

  host.emit("movieNightClearPlaylist");
  await waitForState("playlist clear clears active item", (state) => (
    state.playlist.length === 0
    && state.activePlaylistItem === null
  ));

  const autoHostA = await joinSocket({
    username: "AutoHostA",
    room: autoHostRoomId,
    desiredAutoHostEnabled: true,
  });
  assertCondition(autoHostA.joinResult.hostId === autoHostA.id, "A should begin as host");
  assertCondition(autoHostA.joinResult.isAutoHostEnabled === true, "A should enable Auto-Host");

  const autoHostB = await joinSocket({ username: "AutoHostB", room: autoHostRoomId });
  assertCondition(autoHostB.joinResult.hostId === autoHostA.id, "B should see A as host");
  assertCondition(autoHostB.joinResult.isAutoHostEnabled === true, "B should see Auto-Host enabled");

  const aReceivesAutoNewHost = waitForEvent(
    autoHostA,
    "newHost",
    "Auto-Host newHost sent to A",
    (hostId) => hostId === autoHostB.id,
  );
  const bReceivesAutoNewHost = waitForEvent(
    autoHostB,
    "newHost",
    "Auto-Host newHost sent to B",
    (hostId) => hostId === autoHostB.id,
  );

  autoHostB.emit("autoHostIntent");
  await Promise.all([aReceivesAutoNewHost, bReceivesAutoNewHost]);

  const aReceivesAutoMediaUpdate = waitForEvent(
    autoHostA,
    "mediaUpdate",
    "Auto-Host mediaUpdate sent to A after intent transfer",
    (update) => update.id === autoHostB.id && update.makeHost === false,
  );
  autoHostB.emit("mediaUpdate", mediaPayload({ mediaId: "auto-host-b", userInitiated: true }));
  await aReceivesAutoMediaUpdate;

  const autoHostC = await joinSocket({ username: "AutoHostC", room: autoHostRoomId });
  assertCondition(autoHostC.joinResult.hostId === autoHostB.id, "C should see B as host after Auto-Host transfer");

  const bReceivesStalePlayerState = waitForEvent(
    autoHostB,
    "playerStateUpdate",
    "B receives stale playerStateUpdate from A before authoritative join check",
    (update) => update.id === autoHostA.id && update.state === "paused",
  );
  autoHostA.emit("playerStateUpdate", {
    state: "paused",
    time: 2000,
    duration: 60000,
    playbackRate: 1,
  });
  await bReceivesStalePlayerState;
  const staleVerifier = await joinSocket({ username: "AutoHostStaleVerifier", room: autoHostRoomId });
  assertCondition(staleVerifier.joinResult.hostId === autoHostB.id, "A stale playerStateUpdate should not change authoritative host state");

  const bReceivesNonUserMediaUpdate = waitForEvent(
    autoHostB,
    "mediaUpdate",
    "B receives non-user-initiated mediaUpdate from A before authoritative join check",
    (update) => update.id === autoHostA.id && update.makeHost === false,
  );
  autoHostA.emit("mediaUpdate", mediaPayload({ mediaId: "auto-host-a-background", userInitiated: false }));
  await bReceivesNonUserMediaUpdate;
  const nonUserVerifier = await joinSocket({ username: "AutoHostNonUserVerifier", room: autoHostRoomId });
  assertCondition(nonUserVerifier.joinResult.hostId === autoHostB.id, "A non-user-initiated mediaUpdate should not transfer host");

  const formerHostAReceivesAutoNewHost = waitForEvent(
    autoHostA,
    "newHost",
    "former host A receives Auto-Host newHost when taking host back",
    (hostId) => hostId === autoHostA.id,
  );
  const bReceivesFormerHostMediaUpdate = waitForEvent(
    autoHostB,
    "mediaUpdate",
    "B receives former host A mediaUpdate with makeHost",
    (update) => update.id === autoHostA.id && update.makeHost === true,
  );
  autoHostA.emit("mediaUpdate", mediaPayload({ mediaId: "auto-host-a-return", userInitiated: true }));
  await Promise.all([formerHostAReceivesAutoNewHost, bReceivesFormerHostMediaUpdate]);
  const formerHostVerifier = await joinSocket({ username: "AutoHostFormerHostVerifier", room: autoHostRoomId });
  assertCondition(formerHostVerifier.joinResult.hostId === autoHostA.id, "Current behavior: former host A can take host back with a user-initiated mediaUpdate");

  const directPlexRoomId = `${autoHostRoomId}_DIRECT_PLEX`;
  const directA = await joinSocket({
    username: "DirectPlexA",
    room: directPlexRoomId,
    desiredAutoHostEnabled: true,
  });
  const directB = await joinSocket({ username: "DirectPlexB", room: directPlexRoomId });
  assertCondition(directB.joinResult.hostId === directA.id, "Direct Plex scenario should begin with A as host");

  const directAReceivesNullMediaUpdate = waitForEvent(
    directA,
    "mediaUpdate",
    "polling-origin Plex media detection with userInitiated omitted does not make host",
    (update) => update.id === directB.id && update.makeHost === false,
  );
  directB.emit("mediaUpdate", mediaPayload({ mediaId: "direct-plex-b" }));
  await directAReceivesNullMediaUpdate;
  const directVerifier = await joinSocket({ username: "DirectPlexVerifier", room: directPlexRoomId });
  assertCondition(directVerifier.joinResult.hostId === directA.id, "Polling-origin null media update should not initiate Auto-Host");

  const interfaceExternalRoomId = `${autoHostRoomId}_INTERFACE_EXTERNAL`;
  const interfaceA = await joinSocket({
    username: "InterfaceExternalA",
    room: interfaceExternalRoomId,
    desiredAutoHostEnabled: true,
  });
  const interfaceB = await joinSocket({ username: "InterfaceExternalB", room: interfaceExternalRoomId });
  assertCondition(interfaceB.joinResult.hostId === interfaceA.id, "Interface external scenario should begin with A as host");

  const interfaceNewHostEvents = [interfaceA, interfaceB].map((socket) => waitForEvent(
    socket,
    "newHost",
    `interface playback Auto-Host broadcast to ${socket.joinResult.user.username}`,
    (hostId) => hostId === interfaceB.id,
  ));
  interfaceB.emit("autoHostIntent");
  await Promise.all(interfaceNewHostEvents);
  const interfaceHostVerifier = await joinSocket({ username: "InterfaceHostVerifier", room: interfaceExternalRoomId });
  assertCondition(interfaceHostVerifier.joinResult.hostId === interfaceB.id, "Interface playback should transfer host to B exactly once");

  const interfaceAReceivesMedia = waitForEvent(
    interfaceA,
    "mediaUpdate",
    "new host media update after interface Auto-Host works normally",
    (update) => update.id === interfaceB.id && update.makeHost === false && update.media.ratingKey === "interface-external-b",
  );
  interfaceB.emit("mediaUpdate", mediaPayload({ mediaId: "interface-external-b" }));
  await interfaceAReceivesMedia;

  const interfaceBReceivesSyncEcho = waitForEvent(
    interfaceB,
    "mediaUpdate",
    "old host sync-directed update cannot reclaim host",
    (update) => update.id === interfaceA.id && update.makeHost === false,
  );
  interfaceA.emit("mediaUpdate", mediaPayload({ mediaId: "interface-external-b", userInitiated: false }));
  await interfaceBReceivesSyncEcho;
  const interfaceEchoVerifier = await joinSocket({ username: "InterfaceEchoVerifier", room: interfaceExternalRoomId });
  assertCondition(interfaceEchoVerifier.joinResult.hostId === interfaceB.id, "Old host sync/poll echo should not reclaim host");

  const autoHostDisabledRoomId = `${autoHostRoomId}_DISABLED`;
  const disabledA = await joinSocket({ username: "AutoHostDisabledA", room: autoHostDisabledRoomId });
  const disabledB = await joinSocket({ username: "AutoHostDisabledB", room: autoHostDisabledRoomId });
  const disabledAReceivesMediaUpdate = waitForEvent(
    disabledA,
    "mediaUpdate",
    "Auto-Host disabled leaves user-initiated media update as non-transfer",
    (update) => update.id === disabledB.id && update.makeHost === false,
  );
  disabledB.emit("mediaUpdate", mediaPayload({ mediaId: "auto-host-disabled-b", userInitiated: true }));
  await disabledAReceivesMediaUpdate;
  const disabledVerifier = await joinSocket({ username: "AutoHostDisabledVerifier", room: autoHostDisabledRoomId });
  assertCondition(disabledVerifier.joinResult.hostId === disabledA.id, "Auto-Host disabled behavior should remain unchanged");

  const manualParticipants = [
    autoHostA,
    autoHostB,
    autoHostC,
    staleVerifier,
    nonUserVerifier,
    formerHostVerifier,
  ];
  const manualNewHostEvents = manualParticipants.map((socket) => waitForEvent(
    socket,
    "newHost",
    `manual transfer newHost broadcast to ${socket.joinResult.user.username}`,
    (hostId) => hostId === autoHostB.id,
  ));
  autoHostA.emit("transferHost", autoHostB.id);
  await Promise.all(manualNewHostEvents);

  pass("Sync-A-Rama playlist, poll, Auto-Host, and host-transfer state verified");
})().catch((error) => {
  fail(error.message);
});
NODE
'
