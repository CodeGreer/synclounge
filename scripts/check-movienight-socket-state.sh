#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:8092}"
ROOM_ID="${ROOM_ID:-MOVIENIGHT_SMOKE_$(date +%s)}"

docker exec -e APP_URL="$APP_URL" -e ROOM_ID="$ROOM_ID" movienight-dev sh -lc '
cd /workspace/movienight

node <<NODE
const io = require("socket.io-client");

const appUrl = process.env.APP_URL;
const roomId = process.env.ROOM_ID;

const itemOne = {
  source: "plex",
  playlistKey: "plex:smoke-server:smoke-rating-key-1",
  title: "MovieNight Smoke Test One",
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
  title: "MovieNight Smoke Test Two",
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
let latestState = null;

const fail = (message) => {
  console.error("FAIL:", message);
  sockets.forEach((socket) => socket.close());
  process.exit(1);
};

const pass = (message) => {
  console.log("PASS:", message);
  sockets.forEach((socket) => socket.close());
  process.exit(0);
};

const waitForState = (label, predicate) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error("Timed out waiting for " + label));
  }, 10000);

  const check = (state) => {
    if (!predicate(state)) {
      return;
    }

    clearTimeout(timeout);
    resolve(state);
  };

  if (latestState) {
    check(latestState);
  }

  stateWaiters.push(check);
});

const stateWaiters = [];

const joinSocket = ({ username }) => new Promise((resolve, reject) => {
  const socket = io(appUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  sockets.push(socket);

  socket.on("connect_error", reject);

  socket.once("slPing", (secret) => {
    socket.emit("slPong", secret);
    socket.emit("join", {
      roomId,
      desiredUsername: username,
      desiredPartyPausingEnabled: true,
      desiredAutoHostEnabled: false,
      thumb: null,
      playerProduct: "movienight-smoke-test",
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

    resolve(socket);
  });
});

(async () => {
  const host = await joinSocket({ username: "MovieNightSmokeHost" });
  const guest = await joinSocket({ username: "MovieNightSmokeGuest" });

  guest.on("movieNightState", (state) => {
    latestState = state;
    stateWaiters.slice().forEach((check) => check(state));
  });

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
  await waitForState("playlist remove clears active item", (state) => (
    state.playlist.length === 1
    && state.playlist[0].playlistKey === itemOne.playlistKey
    && state.activePlaylistItem === null
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

  pass("MovieNight playlist state synced to guest");
})().catch((error) => {
  fail(error.message);
});
NODE
'
