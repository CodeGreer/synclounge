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

const testItem = {
  source: "plex",
  playlistKey: "plex:smoke-server:smoke-rating-key",
  title: "MovieNight Smoke Test",
  year: 2026,
  type: "movie",
  ratingKey: "smoke-rating-key",
  key: "/library/metadata/smoke-rating-key",
  machineIdentifier: "smoke-server",
  thumb: "/library/metadata/smoke-rating-key/thumb",
  art: "/library/metadata/smoke-rating-key/art",
  duration: 60000,
};

const sockets = [];

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

const timeout = setTimeout(() => {
  fail("Timed out waiting for MovieNight socket state");
}, 10000);

const joinSocket = ({ username }) => new Promise((resolve, reject) => {
  const socket = io(appUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  sockets.push(socket);

  socket.on("connect_error", reject);

  socket.on("slPing", (secret) => {
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
    const found = state.playlist.some((item) => item.playlistKey === testItem.playlistKey);

    if (!found) {
      return;
    }

    clearTimeout(timeout);
    pass("Guest received host playlist update over movieNightState");
  });

  host.emit("movieNightAddPlaylistItem", testItem);
})().catch((error) => {
  clearTimeout(timeout);
  fail(error.message);
});
NODE
'
