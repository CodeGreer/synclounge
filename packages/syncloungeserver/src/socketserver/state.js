import { v4 as uuidv4 } from 'uuid';

const rooms = new Map();
// Map from socket id to room name
const socketRoomId = new Map();
const socketLatencyData = new Map();

const getNumberFromUsername = (username) => parseInt(username.match(/\((\d+)\)$/)[1], 10);

export const getUserRoomId = (socketId) => socketRoomId.get(socketId);

export const getUserRoom = (socketId) => rooms.get(getUserRoomId(socketId));

export const getRoomUserData = (socketId) => getUserRoom(socketId)
  .users.get(socketId);

const createMovieNightState = () => ({
  nextNominationId: 1,
  nextPlaylistItemId: 1,
  nextPollId: 1,
  nominations: [],
  playlist: [],
  playlistVisibility: 'next',
  playlistAutoPlay: false,
  activePlaylistItem: null,
  activePoll: null,
});

const cloneMovieNightPoll = (poll) => (poll
  ? {
    ...poll,
    candidates: poll.candidates.map((candidate) => ({ ...candidate })),
    votesBySocketId: Object.entries(poll.votesBySocketId || {})
      .reduce((votes, [socketId, candidateIds]) => ({
        ...votes,
        [socketId]: candidateIds.slice(),
      }), {}),
  }
  : null);

const cloneMovieNightState = (movieNight) => ({
  nextNominationId: movieNight.nextNominationId,
  nextPlaylistItemId: movieNight.nextPlaylistItemId,
  nextPollId: movieNight.nextPollId,
  nominations: movieNight.nominations.map((nomination) => ({ ...nomination })),
  playlist: movieNight.playlist.map((item) => ({ ...item })),
  playlistVisibility: movieNight.playlistVisibility,
  playlistAutoPlay: Boolean(movieNight.playlistAutoPlay),
  activePlaylistItem: movieNight.activePlaylistItem
    ? { ...movieNight.activePlaylistItem }
    : null,
  activePoll: cloneMovieNightPoll(movieNight.activePoll),
});

const getSocketMovieNightState = (socketId) => getUserRoom(socketId).movieNight;

const getUniqueUsername = ({ usernames, desiredUsername }) => {
  if (!usernames.includes(desiredUsername)) {
    return desiredUsername;
  }

  // Get users with same username that are numbered like:  username(1)
  const sameUsersNum = usernames.filter((username) => username.startsWith(`${desiredUsername}(`));
  if (sameUsersNum.length > 0) {
    const userNumbers = sameUsersNum.map(getNumberFromUsername);
    const nextNumber = Math.max(...userNumbers) + 1;

    return `${desiredUsername}(${nextNumber})`;
  }

  return `${desiredUsername}(1)`;
};

export const getSocketLatency = (socketId) => socketLatencyData.get(socketId).rtt / 2;

export const updateUserPlayerState = ({
  socketId, state, time, duration, playbackRate,
}) => {
  const userRoomData = getRoomUserData(socketId);
  userRoomData.state = state;
  // Adjust time by sender's latency
  userRoomData.time = state === 'playing'
    ? time + getSocketLatency(socketId)
    : time;
  userRoomData.duration = duration;
  userRoomData.playbackRate = playbackRate;
  userRoomData.updatedAt = Date.now();
};

export const updateUserMedia = ({
  socketId, media,
}) => {
  const userRoomData = getRoomUserData(socketId);
  userRoomData.media = media;
};

export const updateUserSyncFlexibility = ({
  socketId, syncFlexibility,
}) => {
  const userRoomData = getRoomUserData(socketId);
  userRoomData.syncFlexibility = syncFlexibility;
};

export const addUserToRoom = ({
  socketId, roomId, desiredUsername, thumb, playerProduct,
}) => {
  const { users } = rooms.get(roomId);

  const usernames = [...users.values()].map((user) => user.username);

  socketRoomId.set(socketId, roomId);
  users.set(socketId, {
    username: getUniqueUsername({ usernames, desiredUsername }),
    thumb,
    playerProduct,
  });
};

export const createRoom = ({
  id, isPartyPausingEnabled, isAutoHostEnabled, hostId,
}) => {
  rooms.set(id, {
    isPartyPausingEnabled,
    isAutoHostEnabled,
    hostId,
    movieNight: createMovieNightState(),
    users: new Map(),
  });
};

export const isUserInARoom = (socketId) => socketRoomId.has(socketId);

export const doesRoomExist = (roomId) => rooms.has(roomId);

export const getRoomSocketIds = (roomId) => [...rooms.get(roomId).users.keys()];

export const formatUserData = ({
  recipientId, updatedAt, playbackRate, state, time, ...rest
}) => ({
  ...rest,
  playbackRate,
  state,
  // Adjust time by age if playing
  time: state === 'playing'
    ? time + (getSocketLatency(recipientId) + Date.now() - updatedAt) * playbackRate
    : time,
});

const getOtherUserData = ({ roomId, exceptSocketId }) => Object.fromEntries(
  [...rooms.get(roomId).users]
    .filter(([socketId]) => socketId !== exceptSocketId)
    .map(([id, data]) => ([id, formatUserData({ recipientId: exceptSocketId, ...data })])),
);

export const getRoomHostId = (roomId) => rooms.get(roomId).hostId;

export const getJoinData = ({ roomId, socketId }) => {
  const { username } = getRoomUserData(socketId);
  const {
    isPartyPausingEnabled, isAutoHostEnabled, movieNight,
  } = rooms.get(roomId);

  return {
    isPartyPausingEnabled,
    isAutoHostEnabled,
    movieNight: cloneMovieNightState(movieNight),
    hostId: getRoomHostId(roomId),
    user: {
      id: socketId,
      username,
    },
    users: getOtherUserData({ roomId, exceptSocketId: socketId }),
  };
};

export const removeUser = (socketId) => {
  rooms.get(getUserRoomId(socketId)).users.delete(socketId);
  socketRoomId.delete(socketId);
};

export const removeRoom = (roomId) => {
  rooms.delete(roomId);
};

export const isUserHost = (socketId) => getUserRoom(socketId).hostId === socketId;

export const getRoomSize = (roomId) => rooms.get(roomId).users.size;

export const isRoomEmpty = (roomId) => getRoomSize(roomId) <= 0;

export const getAnySocketIdInRoom = (roomId) => rooms.get(roomId).users.keys().next().value;

export const makeUserHost = (socketId) => {
  getUserRoom(socketId).hostId = socketId;
};

export const isUserInRoom = ({ roomId, socketId }) => rooms.get(roomId).users.has(socketId);

export const getSocketPingSecret = (socketId) => socketLatencyData.get(socketId)?.secret;

export const updateSocketLatency = (socketId) => {
  const latencyData = socketLatencyData.get(socketId);

  // TODO: potentially smooth it? or also measure variance?
  latencyData.rtt = Date.now() - latencyData.sentAt;

  // Reset secret
  latencyData.secret = null;
};

export const generateAndSetSocketLatencySecret = (socketId) => {
  const secret = uuidv4();
  const latencyData = socketLatencyData.get(socketId);
  latencyData.secret = secret;
  latencyData.sentAt = Date.now();
  return secret;
};

export const setSocketLatencyIntervalId = ({ socketId, intervalId }) => {
  socketLatencyData.get(socketId).intervalId = intervalId;
};

export const doesSocketHaveRtt = (socketId) => socketLatencyData.get(socketId)?.rtt != null;

export const initSocketLatencyData = (socketId) => {
  socketLatencyData.set(socketId, {});
};

export const removeSocketLatencyData = (socketId) => {
  socketLatencyData.delete(socketId);
};

export const setIsPartyPausingEnabledInSocketRoom = ({ socketId, isPartyPausingEnabled }) => {
  getUserRoom(socketId).isPartyPausingEnabled = isPartyPausingEnabled;
};

export const setIsAutoHostEnabledInSocketRoom = ({ socketId, isAutoHostEnabled }) => {
  getUserRoom(socketId).isAutoHostEnabled = isAutoHostEnabled;
};

export const isPartyPausingEnabledInSocketRoom = (socketId) => getUserRoom(socketId)
  .isPartyPausingEnabled;

export const isAutoHostEnabledInSocketRoom = (socketId) => getUserRoom(socketId)
  .isAutoHostEnabled;

export const clearSocketLatencyInterval = (socketId) => {
  clearInterval(socketLatencyData.get(socketId).intervalId);
};

export const getJoinedUserCount = () => socketRoomId.size;

const getLoad = () => {
  if (getJoinedUserCount() < 25) {
    return 'low';
  }

  if (getJoinedUserCount() < 50) {
    return 'medium';
  }

  return 'high';
};

export const getHealth = () => ({
  load: getLoad(),
});

export const getSocketCount = () => socketLatencyData.size;

export const getMovieNightState = (roomId) => cloneMovieNightState(rooms.get(roomId).movieNight);

export const addMovieNightNomination = ({ socketId, nomination }) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (
    nomination.nominationKey
    && movieNight.nominations
      .some((existing) => existing.nominationKey === nomination.nominationKey)
  ) {
    return;
  }

  movieNight.nominations.push({
    ...nomination,
    id: movieNight.nextNominationId,
  });

  movieNight.nextNominationId += 1;
};

export const removeMovieNightNomination = ({ socketId, id }) => {
  const movieNight = getSocketMovieNightState(socketId);
  movieNight.nominations = movieNight.nominations
    .filter((nomination) => nomination.id !== id);
};

export const addMovieNightPlaylistItem = ({ socketId, item }) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (
    item.playlistKey
    && movieNight.playlist.some((existing) => existing.playlistKey === item.playlistKey)
  ) {
    return;
  }

  movieNight.playlist.push({
    ...item,
    id: movieNight.nextPlaylistItemId,
  });

  movieNight.nextPlaylistItemId += 1;
};

export const removeMovieNightPlaylistItem = ({ socketId, id }) => {
  const movieNight = getSocketMovieNightState(socketId);

  movieNight.playlist = movieNight.playlist.filter((item) => item.id !== id);

  if (movieNight.activePlaylistItem && movieNight.activePlaylistItem.id === id) {
    movieNight.activePlaylistItem = null;
  }
};

const moveMovieNightPlaylistItem = ({ socketId, id, offset }) => {
  const movieNight = getSocketMovieNightState(socketId);
  const index = movieNight.playlist.findIndex((item) => item.id === id);
  const newIndex = index + offset;

  if (index < 0 || newIndex < 0 || newIndex >= movieNight.playlist.length) {
    return;
  }

  const playlist = movieNight.playlist.slice();
  const [item] = playlist.splice(index, 1);
  playlist.splice(newIndex, 0, item);
  movieNight.playlist = playlist;
};

export const moveMovieNightPlaylistItemUp = ({ socketId, id }) => {
  moveMovieNightPlaylistItem({ socketId, id, offset: -1 });
};

export const moveMovieNightPlaylistItemDown = ({ socketId, id }) => {
  moveMovieNightPlaylistItem({ socketId, id, offset: 1 });
};

export const clearMovieNightPlaylist = (socketId) => {
  const movieNight = getSocketMovieNightState(socketId);

  movieNight.playlist = [];
  movieNight.activePlaylistItem = null;
};

export const setMovieNightPlaylistVisibility = ({ socketId, visibility }) => {
  if (!['private', 'next', 'public'].includes(visibility)) {
    return;
  }

  getSocketMovieNightState(socketId).playlistVisibility = visibility;
};

export const setMovieNightPlaylistAutoPlay = ({ socketId, playlistAutoPlay }) => {
  getSocketMovieNightState(socketId).playlistAutoPlay = Boolean(playlistAutoPlay);
};

export const setMovieNightActivePlaylistItem = ({ socketId, item }) => {
  getSocketMovieNightState(socketId).activePlaylistItem = item
    ? {
      id: item.id,
      playlistKey: item.playlistKey,
      machineIdentifier: item.machineIdentifier,
      ratingKey: item.ratingKey,
    }
    : null;
};

const createApprovalPollFromNominations = (movieNight) => ({
  id: movieNight.nextPollId,
  source: 'nominations',
  mode: 'approval',
  status: 'open',
  candidates: movieNight.nominations.map((nomination) => ({ ...nomination })),
  votesBySocketId: {},
  createdAt: new Date().toISOString(),
  closedAt: null,
});

export const startMovieNightApprovalPollFromNominations = ({ socketId }) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (movieNight.nominations.length === 0) {
    return;
  }

  movieNight.activePoll = createApprovalPollFromNominations(movieNight);
  movieNight.nextPollId += 1;
};

export const setMovieNightPollApproval = ({
  socketId, candidateId, approved,
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const { activePoll } = movieNight;

  if (!activePoll || activePoll.status !== 'open') {
    return;
  }

  const candidateExists = activePoll.candidates
    .some((candidate) => String(candidate.id) === String(candidateId));

  if (!candidateExists) {
    return;
  }

  const approvals = new Set(activePoll.votesBySocketId[socketId] || []);

  if (approved) {
    approvals.add(candidateId);
  } else {
    approvals.delete(candidateId);
  }

  if (approvals.size > 0) {
    activePoll.votesBySocketId[socketId] = Array.from(approvals);
  } else {
    delete activePoll.votesBySocketId[socketId];
  }
};

export const closeMovieNightPoll = ({ socketId }) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (!movieNight.activePoll || movieNight.activePoll.status !== 'open') {
    return;
  }

  movieNight.activePoll.status = 'closed';
  movieNight.activePoll.closedAt = new Date().toISOString();
};

export const clearMovieNightPoll = ({ socketId }) => {
  getSocketMovieNightState(socketId).activePoll = null;
};

export const getRoomCount = () => rooms.size;
