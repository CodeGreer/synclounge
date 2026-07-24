"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _state = require("./state");
var _actions = require("./actions");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const MOVIENIGHT_RATE_LIMIT_WINDOW_MS = 10000;
const MOVIENIGHT_RATE_LIMIT_MAX_ACTIONS = 60;
const MAX_CHAT_MESSAGE_LENGTH = 1000;
const movieNightActionBuckets = new Map();
const canManageRoomSetting = ({
  socket,
  trustedMode
}) => (0, _state.isUserInARoom)(socket.id) && ((0, _state.isUserHost)(socket.id) || trustedMode);
const allowMovieNightAction = (socket, actionName) => {
  const now = Date.now();
  const key = "".concat(socket.id, ":").concat(actionName);
  const bucket = movieNightActionBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= MOVIENIGHT_RATE_LIMIT_WINDOW_MS) {
    movieNightActionBuckets.set(key, {
      startedAt: now,
      count: 1
    });
    return true;
  }
  if (bucket.count >= MOVIENIGHT_RATE_LIMIT_MAX_ACTIONS) {
    (0, _actions.logSocket)({
      socketId: socket.id,
      message: "Sync-A-Rama action rate limited: ".concat(actionName)
    });
    return false;
  }
  bucket.count += 1;
  return true;
};
const clearMovieNightRateLimit = socketId => {
  [...movieNightActionBuckets.keys()].filter(key => key.startsWith("".concat(socketId, ":"))).forEach(key => movieNightActionBuckets["delete"](key));
};
const emitMovieNightStateIfChanged = ({
  server,
  socket,
  actionName,
  change
}) => {
  if (!allowMovieNightAction(socket, actionName)) {
    return;
  }
  if (change()) {
    (0, _actions.emitMovieNightStateToRoom)({
      server,
      socketId: socket.id
    });
  }
};
const join = ({
  server,
  socket,
  data: {
    roomId,
    desiredUsername,
    desiredPartyPausingEnabled,
    desiredAutoHostEnabled,
    thumb,
    playerProduct,
    state,
    time,
    duration,
    playbackRate,
    media,
    syncFlexibility
  }
}) => {
  if (!(0, _state.doesSocketHaveRtt)(socket.id)) {
    // Ignore join if we don't have rtt yet.
    // Client should never do this so this just exists for bad actors
    (0, _actions.logSocket)({
      socketId: socket.id,
      message: 'Socket tried to join without finishing initial ping/pong'
    });
    socket.disconnect(true);
    return;
  }
  if ((0, _state.isUserInARoom)(socket.id)) {
    (0, _actions.removeUserAndUpdateRoom)({
      server,
      socketId: socket.id
    });
  }
  if (!(0, _state.doesRoomExist)(roomId)) {
    (0, _actions.log)('Creating room:', roomId);
    (0, _state.createRoom)({
      id: roomId,
      isPartyPausingEnabled: desiredPartyPausingEnabled,
      isAutoHostEnabled: desiredAutoHostEnabled,
      hostId: socket.id
    });
    (0, _actions.logRoomsStats)();
  }
  (0, _state.addUserToRoom)({
    socketId: socket.id,
    roomId,
    desiredUsername,
    thumb,
    playerProduct
  });
  (0, _actions.logSocket)({
    socketId: socket.id,
    message: "join \"".concat(roomId, "\"")
  });
  (0, _state.updateUserPlayerState)({
    socketId: socket.id,
    state,
    time,
    duration,
    playbackRate
  });
  (0, _state.updateUserSyncFlexibility)({
    socketId: socket.id,
    syncFlexibility
  });
  (0, _state.updateUserMedia)({
    socketId: socket.id,
    media
  });

  // Broadcast user joined to everyone but this
  (0, _actions.emitAdjustedUserDataToRoom)({
    server,
    exceptSocketId: socket.id,
    eventName: 'userJoined',
    userData: (0, _state.getRoomUserData)(socket.id)
  });
  (0, _actions.emitToSocket)({
    server,
    socketId: socket.id,
    eventName: 'joinResult',
    data: _objectSpread({
      success: true
    }, (0, _state.getJoinData)({
      roomId,
      socketId: socket.id
    }))
  });
  (0, _actions.logSocketStats)();
  (0, _actions.logRoomStats)(roomId);
};
const disconnect = ({
  server,
  socket
}) => {
  (0, _actions.logSocket)({
    socketId: socket.id,
    message: 'disconnect'
  });
  if ((0, _state.isUserInARoom)(socket.id)) {
    const roomId = (0, _actions.removeUserAndUpdateRoom)({
      server,
      socketId: socket.id
    });
    if (roomId != null) {
      (0, _actions.logRoomStats)(roomId);
    }
  }
  (0, _state.clearSocketLatencyInterval)(socket.id);
  (0, _state.removeSocketLatencyData)(socket.id);
  clearMovieNightRateLimit(socket.id);
  (0, _actions.logSocketStats)();
};
const transferHost = ({
  server,
  socket,
  data: desiredHostId
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  const roomId = (0, _state.getUserRoomId)(socket.id);
  if (!(0, _state.isUserInRoom)({
    roomId,
    socketId: desiredHostId
  })) {
    socket.disconnect(true);
    return;
  }
  (0, _actions.logSocket)({
    socketId: socket.id,
    message: "Transferring host to: [".concat(desiredHostId, "] ").concat((0, _state.getRoomUserData)(desiredHostId).username)
  });
  (0, _state.makeUserHost)(desiredHostId);
  (0, _actions.announceNewHost)({
    server,
    roomId,
    hostId: desiredHostId
  });
};
const autoHostIntent = ({
  server,
  socket
}) => {
  if (!(0, _state.isUserInARoom)(socket.id)) {
    return;
  }
  if ((0, _state.isUserHost)(socket.id) || !(0, _state.isAutoHostEnabledInSocketRoom)(socket.id)) {
    return;
  }
  const roomId = (0, _state.getUserRoomId)(socket.id);
  (0, _state.makeUserHost)(socket.id);
  (0, _actions.logSocket)({
    socketId: socket.id,
    message: 'Making host because user initiated playback through Sync-A-Rama'
  });
  (0, _actions.announceNewHost)({
    server,
    roomId,
    hostId: socket.id
  });
};
const playerStateUpdate = ({
  server,
  socket,
  data: {
    state,
    time,
    duration,
    playbackRate
  }
}) => {
  if (!(0, _state.isUserInARoom)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  (0, _state.updateUserPlayerState)({
    socketId: socket.id,
    state,
    time,
    duration,
    playbackRate
  });
  (0, _actions.emitPlayerStateUpdateToRoom)({
    server,
    socketId: socket.id
  });
};
const mediaUpdate = ({
  server,
  socket,
  data: {
    state,
    time,
    duration,
    playbackRate,
    media,
    userInitiated
  }
}) => {
  if (!(0, _state.isUserInARoom)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  (0, _state.updateUserPlayerState)({
    socketId: socket.id,
    state,
    time,
    duration,
    playbackRate
  });
  (0, _state.updateUserMedia)({
    socketId: socket.id,
    media
  });
  const makeHost = userInitiated === true && !(0, _state.isUserHost)(socket.id) && (0, _state.isAutoHostEnabledInSocketRoom)(socket.id);
  if (makeHost) {
    // Emit to user that they are host now
    (0, _state.makeUserHost)(socket.id);
    (0, _actions.emitToSocket)({
      server,
      socketId: socket.id,
      eventName: 'newHost',
      data: socket.id
    });
    (0, _actions.logSocket)({
      socketId: socket.id,
      message: 'Making host because user initiated media change'
    });
  }
  (0, _actions.emitMediaUpdateToRoom)({
    server,
    socketId: socket.id,
    makeHost
  });
};
const slPong = ({
  server,
  pingInterval,
  socket,
  data: secret
}) => {
  const expectedSecret = (0, _state.getSocketPingSecret)(socket.id);
  if (expectedSecret === null || secret !== expectedSecret) {
    (0, _actions.logSocket)({
      socketId: socket.id,
      message: "Incorrect secret. Expected \"".concat(expectedSecret, "\", got \"").concat(secret, "\"")
    });
    socket.disconnect(true);
    return;
  }
  (0, _state.updateSocketLatency)(socket.id);
  (0, _state.setSocketLatencyIntervalId)({
    socketId: socket.id,
    intervalId: setTimeout(() => {
      (0, _actions.sendPing)({
        server,
        socketId: socket.id
      });
    }, pingInterval)
  });
};
const sendMessage = ({
  server,
  socket,
  data: text
}) => {
  if (!(0, _state.isUserInARoom)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  if (!allowMovieNightAction(socket, 'sendMessage')) {
    return;
  }
  if (typeof text !== 'string') {
    socket.disconnect(true);
    return;
  }
  const trimmedText = text.trim();
  if (!trimmedText) {
    return;
  }
  const sanitizedText = trimmedText.slice(0, MAX_CHAT_MESSAGE_LENGTH);
  (0, _actions.emitToUserRoomExcept)({
    server,
    eventName: 'newMessage',
    data: {
      text: sanitizedText,
      senderId: socket.id
    },
    exceptSocketId: socket.id
  });
};
const setPartyPausingEnabled = ({
  server,
  socket,
  data: isPartyPausingEnabled,
  trustedMode
}) => {
  if (!canManageRoomSetting({
    socket,
    trustedMode
  })) {
    socket.disconnect(true);
    return;
  }
  (0, _actions.logSocket)({
    socketId: socket.id,
    message: "set party pausing to: ".concat(isPartyPausingEnabled)
  });
  (0, _state.setIsPartyPausingEnabledInSocketRoom)({
    socketId: socket.id,
    isPartyPausingEnabled
  });

  // Emitting to everyone including sender as an ack that it went through
  (0, _actions.emitToSocketRoom)({
    server,
    socketId: socket.id,
    eventName: 'setPartyPausingEnabled',
    data: isPartyPausingEnabled
  });
};
const setAutoHostEnabled = ({
  server,
  socket,
  data: isAutoHostEnabled,
  trustedMode
}) => {
  if (!canManageRoomSetting({
    socket,
    trustedMode
  })) {
    socket.disconnect(true);
    return;
  }
  (0, _actions.logSocket)({
    socketId: socket.id,
    message: "set auto host to: ".concat(isAutoHostEnabled)
  });
  (0, _state.setIsAutoHostEnabledInSocketRoom)({
    socketId: socket.id,
    isAutoHostEnabled
  });

  // Emitting to everyone including sender as an ack that it went through
  (0, _actions.emitToSocketRoom)({
    server,
    socketId: socket.id,
    eventName: 'setAutoHostEnabled',
    data: isAutoHostEnabled
  });
};
const partyPause = ({
  server,
  socket,
  data: isPause
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isPartyPausingEnabledInSocketRoom)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  (0, _actions.emitToSocketRoom)({
    server,
    socketId: socket.id,
    eventName: 'partyPause',
    data: {
      senderId: socket.id,
      isPause
    }
  });
};
const syncFlexibilityUpdate = ({
  server,
  socket,
  data: syncFlexibility
}) => {
  if (!(0, _state.isUserInARoom)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  (0, _state.updateUserSyncFlexibility)({
    socketId: socket.id,
    syncFlexibility
  });
  (0, _actions.emitToUserRoomExcept)({
    server,
    eventName: 'syncFlexibilityUpdate',
    data: {
      syncFlexibility,
      id: socket.id
    },
    exceptSocketId: socket.id
  });
};
const movieNightAddNomination = ({
  server,
  socket,
  data: nomination
}) => {
  if (!(0, _state.isUserInARoom)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightAddNomination',
    change: () => (0, _state.addMovieNightNomination)({
      socketId: socket.id,
      nomination
    })
  });
};
const movieNightRemoveNomination = ({
  server,
  socket,
  data: id
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightRemoveNomination',
    change: () => (0, _state.removeMovieNightNomination)({
      socketId: socket.id,
      id
    })
  });
};
const movieNightAddPlaylistItem = ({
  server,
  socket,
  data: item
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightAddPlaylistItem',
    change: () => (0, _state.addMovieNightPlaylistItem)({
      socketId: socket.id,
      item
    })
  });
};
const movieNightRemovePlaylistItem = ({
  server,
  socket,
  data: id
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightRemovePlaylistItem',
    change: () => (0, _state.removeMovieNightPlaylistItem)({
      socketId: socket.id,
      id
    })
  });
};
const movieNightMovePlaylistItemUp = ({
  server,
  socket,
  data: id
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightMovePlaylistItemUp',
    change: () => (0, _state.moveMovieNightPlaylistItemUp)({
      socketId: socket.id,
      id
    })
  });
};
const movieNightMovePlaylistItemDown = ({
  server,
  socket,
  data: id
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightMovePlaylistItemDown',
    change: () => (0, _state.moveMovieNightPlaylistItemDown)({
      socketId: socket.id,
      id
    })
  });
};
const movieNightClearPlaylist = ({
  server,
  socket
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightClearPlaylist',
    change: () => (0, _state.clearMovieNightPlaylist)(socket.id)
  });
};
const movieNightSetPlaylistVisibility = ({
  server,
  socket,
  data: visibility
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightSetPlaylistVisibility',
    change: () => (0, _state.setMovieNightPlaylistVisibility)({
      socketId: socket.id,
      visibility
    })
  });
};
const movieNightSetPlaylistAutoPlay = ({
  server,
  socket,
  data: playlistAutoPlay
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightSetPlaylistAutoPlay',
    change: () => (0, _state.setMovieNightPlaylistAutoPlay)({
      socketId: socket.id,
      playlistAutoPlay
    })
  });
};
const movieNightSetActivePlaylistItem = ({
  server,
  socket,
  data: item
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightSetActivePlaylistItem',
    change: () => (0, _state.setMovieNightActivePlaylistItem)({
      socketId: socket.id,
      item
    })
  });
};
const movieNightStartApprovalPollFromNominations = ({
  server,
  socket
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightStartApprovalPollFromNominations',
    change: () => (0, _state.startMovieNightApprovalPollFromNominations)({
      socketId: socket.id
    })
  });
};
const movieNightSetPollApproval = ({
  server,
  socket,
  data
}) => {
  if (!(0, _state.isUserInARoom)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightSetPollApproval',
    change: () => (0, _state.setMovieNightPollApproval)({
      socketId: socket.id,
      candidateId: data && data.candidateId,
      approved: Boolean(data && data.approved)
    })
  });
};
const movieNightClosePoll = ({
  server,
  socket
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightClosePoll',
    change: () => (0, _state.closeMovieNightPoll)({
      socketId: socket.id
    })
  });
};
const movieNightStartPollRunoff = ({
  server,
  socket,
  data
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightStartPollRunoff',
    change: () => (0, _state.startMovieNightPollRunoff)({
      socketId: socket.id,
      limit: data && data.limit
    })
  });
};
const movieNightClearPoll = ({
  server,
  socket
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightClearPoll',
    change: () => (0, _state.clearMovieNightPoll)({
      socketId: socket.id
    })
  });
};
const kick = ({
  server,
  socket,
  data: id
}) => {
  if (!(0, _state.isUserInARoom)(socket.id) || !(0, _state.isUserHost)(socket.id)) {
    socket.disconnect(true);
    return;
  }
  const roomId = (0, _state.getUserRoomId)(socket.id);
  if (!(0, _state.isUserInRoom)({
    roomId,
    socketId: id
  })) {
    socket.disconnect(true);
    return;
  }
  (0, _actions.logSocket)({
    socketId: socket.id,
    message: "Kicking: [".concat(id, "] ").concat((0, _state.getRoomUserData)(id).username)
  });
  (0, _actions.emitToSocket)({
    server,
    socketId: id,
    eventName: 'kicked',
    data: null
  });
  (0, _actions.removeUserAndUpdateRoom)({
    server,
    socketId: id
  });
  const targetSocket = server.sockets.sockets.get(id);
  if (targetSocket) {
    targetSocket.disconnect(true);
  }
};
const eventHandlers = {
  join,
  slPong,
  playerStateUpdate,
  mediaUpdate,
  autoHostIntent,
  syncFlexibilityUpdate,
  transferHost,
  sendMessage,
  setPartyPausingEnabled,
  setAutoHostEnabled,
  partyPause,
  disconnect,
  movieNightAddNomination,
  movieNightRemoveNomination,
  movieNightAddPlaylistItem,
  movieNightRemovePlaylistItem,
  movieNightMovePlaylistItemUp,
  movieNightMovePlaylistItemDown,
  movieNightClearPlaylist,
  movieNightSetPlaylistVisibility,
  movieNightSetPlaylistAutoPlay,
  movieNightSetActivePlaylistItem,
  movieNightStartApprovalPollFromNominations,
  movieNightSetPollApproval,
  movieNightClosePoll,
  movieNightStartPollRunoff,
  movieNightClearPoll,
  kick
};
const attachEventHandlers = ({
  server,
  pingInterval,
  trustedMode
}) => {
  server.on('connection', socket => {
    const forwardedHeader = socket.handshake.headers['x-forwarded-for'];
    const addressInfo = forwardedHeader ? "".concat(forwardedHeader, " (").concat(socket.conn.remoteAddress, ")") : socket.conn.remoteAddres;
    (0, _actions.logSocket)({
      socketId: socket.id,
      message: "connection: ".concat(addressInfo)
    });
    (0, _state.initSocketLatencyData)(socket.id);
    (0, _actions.sendPing)({
      server,
      socketId: socket.id
    });
    (0, _actions.logSocketStats)();
    Object.entries(eventHandlers).forEach(([name, handler]) => {
      socket.on(name, data => {
        // TODO: eventually pass in state to everything rather than having it all global
        // TODO: move ping interval into state too
        handler({
          server,
          pingInterval,
          socket,
          data,
          trustedMode
        });
      });
    });
  });
};
var _default = exports["default"] = attachEventHandlers;