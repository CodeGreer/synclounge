import {
  doesRoomExist, isUserInARoom, getRoomUserData, isUserHost, removeSocketLatencyData,
  getJoinData, createRoom, addUserToRoom, clearSocketLatencyInterval,
  getUserRoomId, isUserInRoom, updateUserMedia, makeUserHost, updateUserPlayerState,
  getSocketPingSecret, updateSocketLatency, setSocketLatencyIntervalId, doesSocketHaveRtt,
  setIsPartyPausingEnabledInSocketRoom, updateUserSyncFlexibility, setIsAutoHostEnabledInSocketRoom,
  isPartyPausingEnabledInSocketRoom, isAutoHostEnabledInSocketRoom, initSocketLatencyData,
  addMovieNightNomination, removeMovieNightNomination, addMovieNightPlaylistItem,
  removeMovieNightPlaylistItem, moveMovieNightPlaylistItemUp, moveMovieNightPlaylistItemDown,
  clearMovieNightPlaylist, setMovieNightPlaylistVisibility, setMovieNightPlaylistAutoPlay,
  setMovieNightActivePlaylistItem, startMovieNightApprovalPollFromNominations,
  setMovieNightPollApproval, closeMovieNightPoll, startMovieNightPollRunoff,
  clearMovieNightPoll,
} from './state';

import {
  removeUserAndUpdateRoom, emitToSocket, logSocket, emitAdjustedUserDataToRoom, announceNewHost,
  emitPlayerStateUpdateToRoom, emitMediaUpdateToRoom, sendPing, emitToSocketRoom, logRoomStats,
  emitToUserRoomExcept, logSocketStats, logRoomsStats, log, emitMovieNightStateToRoom,
} from './actions';

const MOVIENIGHT_RATE_LIMIT_WINDOW_MS = 10000;
const MOVIENIGHT_RATE_LIMIT_MAX_ACTIONS = 60;
const MAX_CHAT_MESSAGE_LENGTH = 1000;
const movieNightActionBuckets = new Map();

const canManageRoomSetting = ({ socket, trustedMode }) => (
  isUserInARoom(socket.id) && (isUserHost(socket.id) || trustedMode)
);

const allowMovieNightAction = (socket, actionName) => {
  const now = Date.now();
  const key = `${socket.id}:${actionName}`;
  const bucket = movieNightActionBuckets.get(key);

  if (!bucket || now - bucket.startedAt >= MOVIENIGHT_RATE_LIMIT_WINDOW_MS) {
    movieNightActionBuckets.set(key, { startedAt: now, count: 1 });
    return true;
  }

  if (bucket.count >= MOVIENIGHT_RATE_LIMIT_MAX_ACTIONS) {
    logSocket({
      socketId: socket.id,
      message: `Sync-A-Rama action rate limited: ${actionName}`,
    });
    return false;
  }

  bucket.count += 1;
  return true;
};

const clearMovieNightRateLimit = (socketId) => {
  [...movieNightActionBuckets.keys()]
    .filter((key) => key.startsWith(`${socketId}:`))
    .forEach((key) => movieNightActionBuckets.delete(key));
};

const emitMovieNightStateIfChanged = ({ server, socket, actionName, change }) => {
  if (!allowMovieNightAction(socket, actionName)) {
    return;
  }

  if (change()) {
    emitMovieNightStateToRoom({ server, socketId: socket.id });
  }
};

const join = ({
  server, socket, data: {
    roomId, desiredUsername, desiredPartyPausingEnabled, desiredAutoHostEnabled, thumb,
    playerProduct, state, time, duration, playbackRate, media, syncFlexibility,
  },
}) => {
  if (!doesSocketHaveRtt(socket.id)) {
    // Ignore join if we don't have rtt yet.
    // Client should never do this so this just exists for bad actors
    logSocket({ socketId: socket.id, message: 'Socket tried to join without finishing initial ping/pong' });
    socket.disconnect(true);
    return;
  }

  if (isUserInARoom(socket.id)) {
    removeUserAndUpdateRoom({ server, socketId: socket.id });
  }

  if (!doesRoomExist(roomId)) {
    log('Creating room:', roomId);

    createRoom({
      id: roomId,
      isPartyPausingEnabled: desiredPartyPausingEnabled,
      isAutoHostEnabled: desiredAutoHostEnabled,
      hostId: socket.id,
    });

    logRoomsStats();
  }

  addUserToRoom({
    socketId: socket.id,
    roomId,
    desiredUsername,
    thumb,
    playerProduct,
  });

  logSocket({ socketId: socket.id, message: `join "${roomId}"` });

  updateUserPlayerState({
    socketId: socket.id, state, time, duration, playbackRate,
  });

  updateUserSyncFlexibility({
    socketId: socket.id,
    syncFlexibility,
  });

  updateUserMedia({
    socketId: socket.id,
    media,
  });

  // Broadcast user joined to everyone but this
  emitAdjustedUserDataToRoom({
    server,
    exceptSocketId: socket.id,
    eventName: 'userJoined',
    userData: getRoomUserData(socket.id),
  });

  emitToSocket({
    server,
    socketId: socket.id,
    eventName: 'joinResult',
    data: {
      success: true,
      ...getJoinData({ roomId, socketId: socket.id }),
    },
  });

  logSocketStats();
  logRoomStats(roomId);
};

const disconnect = ({ server, socket }) => {
  logSocket({ socketId: socket.id, message: 'disconnect' });

  if (isUserInARoom(socket.id)) {
    const roomId = removeUserAndUpdateRoom({ server, socketId: socket.id });
    if (roomId != null) {
      logRoomStats(roomId);
    }
  }

  clearSocketLatencyInterval(socket.id);
  removeSocketLatencyData(socket.id);
  clearMovieNightRateLimit(socket.id);

  logSocketStats();
};

const transferHost = ({ server, socket, data: desiredHostId }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  const roomId = getUserRoomId(socket.id);
  if (!isUserInRoom({ roomId, socketId: desiredHostId })) {
    socket.disconnect(true);
    return;
  }

  logSocket({
    socketId: socket.id,
    message: `Transferring host to: [${desiredHostId}] ${getRoomUserData(desiredHostId).username}`,
  });
  makeUserHost(desiredHostId);
  announceNewHost({
    server,
    roomId,
    hostId: desiredHostId,
  });
};


const autoHostIntent = ({ server, socket }) => {
  if (!isUserInARoom(socket.id)) {
    return;
  }

  if (!allowMovieNightAction(socket, 'autoHostIntent')) {
    return;
  }

  if (isUserHost(socket.id) || !isAutoHostEnabledInSocketRoom(socket.id)) {
    return;
  }

  const roomId = getUserRoomId(socket.id);
  makeUserHost(socket.id);

  logSocket({
    socketId: socket.id,
    message: 'Making host because user initiated playback through Sync-A-Rama',
  });

  announceNewHost({
    server,
    roomId,
    hostId: socket.id,
  });
};

const playerStateUpdate = ({
  server, socket, data: {
    state, time, duration, playbackRate,
  },
}) => {
  if (!isUserInARoom(socket.id)) {
    socket.disconnect(true);
    return;
  }

  updateUserPlayerState({
    socketId: socket.id, state, time, duration, playbackRate,
  });

  emitPlayerStateUpdateToRoom({ server, socketId: socket.id });
};

const mediaUpdate = ({
  server, socket, data: {
    state, time, duration, playbackRate, media, userInitiated,
  },
}) => {
  if (!isUserInARoom(socket.id)) {
    socket.disconnect(true);
    return;
  }

  updateUserPlayerState({
    socketId: socket.id, state, time, duration, playbackRate,
  });

  updateUserMedia({
    socketId: socket.id,
    media,
  });

  const makeHost = userInitiated === true && !isUserHost(socket.id)
    && isAutoHostEnabledInSocketRoom(socket.id);

  if (makeHost) {
    // Emit to user that they are host now
    makeUserHost(socket.id);
    emitToSocket({
      server,
      socketId: socket.id,
      eventName: 'newHost',
      data: socket.id,
    });

    logSocket({
      socketId: socket.id,
      message: 'Making host because user initiated media change',
    });
  }

  emitMediaUpdateToRoom({ server, socketId: socket.id, makeHost });
};

const slPong = ({
  server, pingInterval, socket, data: secret,
}) => {
  const expectedSecret = getSocketPingSecret(socket.id);
  if (expectedSecret === null || secret !== expectedSecret) {
    logSocket({
      socketId: socket.id,
      message: `Incorrect secret. Expected "${expectedSecret}", got "${secret}"`,
    });

    socket.disconnect(true);
    return;
  }

  updateSocketLatency(socket.id);

  setSocketLatencyIntervalId({
    socketId: socket.id,
    intervalId: setTimeout(() => {
      sendPing({ server, socketId: socket.id });
    }, pingInterval),
  });
};

const sendMessage = ({ server, socket, data: text }) => {
  if (!isUserInARoom(socket.id)) {
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

  emitToUserRoomExcept({
    server,
    eventName: 'newMessage',
    data: {
      text: sanitizedText,
      senderId: socket.id,
    },
    exceptSocketId: socket.id,
  });
};

const setPartyPausingEnabled = ({ server, socket, data: isPartyPausingEnabled, trustedMode }) => {
  if (!canManageRoomSetting({ socket, trustedMode })) {
    socket.disconnect(true);
    return;
  }

  logSocket({
    socketId: socket.id,
    message: `set party pausing to: ${isPartyPausingEnabled}`,
  });

  setIsPartyPausingEnabledInSocketRoom({ socketId: socket.id, isPartyPausingEnabled });

  // Emitting to everyone including sender as an ack that it went through
  emitToSocketRoom({
    server,
    socketId: socket.id,
    eventName: 'setPartyPausingEnabled',
    data: isPartyPausingEnabled,
  });
};

const setAutoHostEnabled = ({ server, socket, data: isAutoHostEnabled, trustedMode }) => {
  if (!canManageRoomSetting({ socket, trustedMode })) {
    socket.disconnect(true);
    return;
  }

  logSocket({
    socketId: socket.id,
    message: `set auto host to: ${isAutoHostEnabled}`,
  });

  setIsAutoHostEnabledInSocketRoom({ socketId: socket.id, isAutoHostEnabled });

  // Emitting to everyone including sender as an ack that it went through
  emitToSocketRoom({
    server,
    socketId: socket.id,
    eventName: 'setAutoHostEnabled',
    data: isAutoHostEnabled,
  });
};

const partyPause = ({ server, socket, data: isPause }) => {
  if (!isUserInARoom(socket.id) || !isPartyPausingEnabledInSocketRoom(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitToSocketRoom({
    server,
    socketId: socket.id,
    eventName: 'partyPause',
    data: {
      senderId: socket.id,
      isPause,
    },
  });
};

const syncFlexibilityUpdate = ({ server, socket, data: syncFlexibility }) => {
  if (!isUserInARoom(socket.id)) {
    socket.disconnect(true);
    return;
  }

  updateUserSyncFlexibility({
    socketId: socket.id,
    syncFlexibility,
  });

  emitToUserRoomExcept({
    server,
    eventName: 'syncFlexibilityUpdate',
    data: {
      syncFlexibility,
      id: socket.id,
    },
    exceptSocketId: socket.id,
  });
};

const movieNightAddNomination = ({ server, socket, data: nomination }) => {
  if (!isUserInARoom(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightAddNomination',
    change: () => addMovieNightNomination({ socketId: socket.id, nomination }),
  });
};

const movieNightRemoveNomination = ({ server, socket, data: id }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightRemoveNomination',
    change: () => removeMovieNightNomination({ socketId: socket.id, id }),
  });
};

const movieNightAddPlaylistItem = ({ server, socket, data: item }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightAddPlaylistItem',
    change: () => addMovieNightPlaylistItem({ socketId: socket.id, item }),
  });
};

const movieNightRemovePlaylistItem = ({ server, socket, data: id }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightRemovePlaylistItem',
    change: () => removeMovieNightPlaylistItem({ socketId: socket.id, id }),
  });
};

const movieNightMovePlaylistItemUp = ({ server, socket, data: id }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightMovePlaylistItemUp',
    change: () => moveMovieNightPlaylistItemUp({ socketId: socket.id, id }),
  });
};

const movieNightMovePlaylistItemDown = ({ server, socket, data: id }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightMovePlaylistItemDown',
    change: () => moveMovieNightPlaylistItemDown({ socketId: socket.id, id }),
  });
};

const movieNightClearPlaylist = ({ server, socket }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightClearPlaylist',
    change: () => clearMovieNightPlaylist(socket.id),
  });
};

const movieNightSetPlaylistVisibility = ({ server, socket, data: visibility }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightSetPlaylistVisibility',
    change: () => setMovieNightPlaylistVisibility({ socketId: socket.id, visibility }),
  });
};

const movieNightSetPlaylistAutoPlay = ({ server, socket, data: playlistAutoPlay }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightSetPlaylistAutoPlay',
    change: () => setMovieNightPlaylistAutoPlay({ socketId: socket.id, playlistAutoPlay }),
  });
};

const movieNightSetActivePlaylistItem = ({ server, socket, data: item }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightSetActivePlaylistItem',
    change: () => setMovieNightActivePlaylistItem({ socketId: socket.id, item }),
  });
};

const movieNightStartApprovalPollFromNominations = ({ server, socket }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightStartApprovalPollFromNominations',
    change: () => startMovieNightApprovalPollFromNominations({ socketId: socket.id }),
  });
};

const movieNightSetPollApproval = ({ server, socket, data }) => {
  if (!isUserInARoom(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightSetPollApproval',
    change: () => setMovieNightPollApproval({
      socketId: socket.id,
      candidateId: data && data.candidateId,
      approved: Boolean(data && data.approved),
    }),
  });
};

const movieNightClosePoll = ({ server, socket }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightClosePoll',
    change: () => closeMovieNightPoll({ socketId: socket.id }),
  });
};

const movieNightStartPollRunoff = ({ server, socket, data }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightStartPollRunoff',
    change: () => startMovieNightPollRunoff({
      socketId: socket.id,
      limit: data && data.limit,
    }),
  });
};

const movieNightClearPoll = ({ server, socket }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  emitMovieNightStateIfChanged({
    server,
    socket,
    actionName: 'movieNightClearPoll',
    change: () => clearMovieNightPoll({ socketId: socket.id }),
  });
};

const kick = ({ server, socket, data: id }) => {
  if (!isUserInARoom(socket.id) || !isUserHost(socket.id)) {
    socket.disconnect(true);
    return;
  }

  const roomId = getUserRoomId(socket.id);
  if (!isUserInRoom({ roomId, socketId: id })) {
    socket.disconnect(true);
    return;
  }

  logSocket({
    socketId: socket.id,
    message: `Kicking: [${id}] ${getRoomUserData(id).username}`,
  });

  emitToSocket({
    server,
    socketId: id,
    eventName: 'kicked',
    data: null,
  });

  removeUserAndUpdateRoom({ server, socketId: id });

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
  kick,
};

const attachEventHandlers = ({ server, pingInterval, trustedMode }) => {
  server.on('connection', (socket) => {
    const forwardedHeader = socket.handshake.headers['x-forwarded-for'];
    const addressInfo = forwardedHeader
      ? `${forwardedHeader} (${socket.conn.remoteAddress})`
      : socket.conn.remoteAddres;

    logSocket({ socketId: socket.id, message: `connection: ${addressInfo}` });
    initSocketLatencyData(socket.id);
    sendPing({ server, socketId: socket.id });
    logSocketStats();

    Object.entries(eventHandlers).forEach(([name, handler]) => {
      socket.on(name, (data) => {
        // TODO: eventually pass in state to everything rather than having it all global
        // TODO: move ping interval into state too
        handler({
          server, pingInterval, socket, data, trustedMode,
        });
      });
    });
  });
};

export default attachEventHandlers;
