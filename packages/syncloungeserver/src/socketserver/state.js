import { v4 as uuidv4 } from 'uuid';

export const MAX_MOVIENIGHT_NOMINATIONS_PER_ROOM = 100;
export const MAX_MOVIENIGHT_PLAYLIST_ITEMS_PER_ROOM = 100;
export const MAX_MOVIENIGHT_POLL_OPTIONS = 50;
export const MAX_MOVIENIGHT_TITLE_LENGTH = 300;
export const MAX_MOVIENIGHT_USERNAME_LENGTH = 80;
export const MAX_MOVIENIGHT_ID_LENGTH = 120;
export const MAX_MOVIENIGHT_IMAGE_URL_LENGTH = 1000;
export const MAX_MOVIENIGHT_SUMMARY_LENGTH = 2000;
export const MAX_MOVIENIGHT_RATING_KEY_LENGTH = 120;
export const MAX_MOVIENIGHT_MACHINE_IDENTIFIER_LENGTH = 120;
export const MAX_MOVIENIGHT_TYPE_LENGTH = 80;

const MOVIENIGHT_PLAYABLE_TYPES = ['movie', 'episode'];

const truncateString = (value, maxLength) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
};

const normalizeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const normalizeMovieNightId = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = truncateString(String(value || ''), MAX_MOVIENIGHT_ID_LENGTH);
  return normalized || null;
};

const sanitizeMovieNightMediaItem = ({ item, id, requirePlayable = false }) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  const source = truncateString(item.source, MAX_MOVIENIGHT_TYPE_LENGTH) || 'manual';
  const title = truncateString(item.title, MAX_MOVIENIGHT_TITLE_LENGTH);
  const type = truncateString(item.type, MAX_MOVIENIGHT_TYPE_LENGTH);
  const ratingKey = truncateString(item.ratingKey, MAX_MOVIENIGHT_RATING_KEY_LENGTH);
  const machineIdentifier = truncateString(
    item.machineIdentifier,
    MAX_MOVIENIGHT_MACHINE_IDENTIFIER_LENGTH,
  );
  const key = truncateString(item.key, MAX_MOVIENIGHT_ID_LENGTH);
  const nominationKey = truncateString(item.nominationKey, MAX_MOVIENIGHT_ID_LENGTH);
  const playlistKey = truncateString(item.playlistKey, MAX_MOVIENIGHT_ID_LENGTH);

  if (!title && !ratingKey && !nominationKey && !playlistKey) {
    return null;
  }

  if (requirePlayable && !MOVIENIGHT_PLAYABLE_TYPES.includes(type)) {
    return null;
  }

  const sanitized = {
    id,
    source,
    title,
    year: normalizeNumber(item.year),
    type,
    ratingKey,
    key,
    machineIdentifier,
    thumb: truncateString(item.thumb, MAX_MOVIENIGHT_IMAGE_URL_LENGTH),
    art: truncateString(item.art, MAX_MOVIENIGHT_IMAGE_URL_LENGTH),
    summary: truncateString(item.summary, MAX_MOVIENIGHT_SUMMARY_LENGTH),
    duration: normalizeNumber(item.duration),
  };

  if (nominationKey) {
    sanitized.nominationKey = nominationKey;
  }

  if (playlistKey) {
    sanitized.playlistKey = playlistKey;
  }

  return Object.fromEntries(Object.entries(sanitized).filter(([, value]) => value != null));
};

const sanitizeMovieNightActivePlaylistItem = (item) => {
  if (!item) {
    return null;
  }

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return undefined;
  }

  const id = normalizeMovieNightId(item.id);
  const playlistKey = truncateString(item.playlistKey, MAX_MOVIENIGHT_ID_LENGTH);
  const machineIdentifier = truncateString(
    item.machineIdentifier,
    MAX_MOVIENIGHT_MACHINE_IDENTIFIER_LENGTH,
  );
  const ratingKey = truncateString(item.ratingKey, MAX_MOVIENIGHT_RATING_KEY_LENGTH);

  if (!id && !playlistKey && (!machineIdentifier || !ratingKey)) {
    return undefined;
  }

  return Object.fromEntries(Object.entries({
    id,
    playlistKey,
    machineIdentifier,
    ratingKey,
  }).filter(([, value]) => value != null));
};

const rooms = new Map();
// Map from socket id to room name
const socketRoomId = new Map();
const socketLatencyData = new Map();

const getNumberFromUsername = (username) => parseInt(username.match(/\((\d+)\)$/)[1], 10);

const sanitizeUsername = (username) => (
  truncateString(username, MAX_MOVIENIGHT_USERNAME_LENGTH) || 'Guest'
);

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
  const safeDesiredUsername = sanitizeUsername(desiredUsername);

  if (!usernames.includes(safeDesiredUsername)) {
    return safeDesiredUsername;
  }

  // Get users with same username that are numbered like:  username(1)
  const sameUsersNum = usernames
    .filter((username) => username.startsWith(`${safeDesiredUsername}(`));
  if (sameUsersNum.length > 0) {
    const userNumbers = sameUsersNum.map(getNumberFromUsername);
    const nextNumber = Math.max(...userNumbers) + 1;

    return `${safeDesiredUsername}(${nextNumber})`;
  }

  return `${safeDesiredUsername}(1)`;
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

  if (movieNight.nominations.length >= MAX_MOVIENIGHT_NOMINATIONS_PER_ROOM) {
    return false;
  }

  const sanitized = sanitizeMovieNightMediaItem({
    item: nomination,
    id: movieNight.nextNominationId,
  });

  if (!sanitized) {
    return false;
  }

  if (
    sanitized.nominationKey
    && movieNight.nominations
      .some((existing) => existing.nominationKey === sanitized.nominationKey)
  ) {
    return false;
  }

  movieNight.nominations.push(sanitized);
  movieNight.nextNominationId += 1;
  return true;
};

export const removeMovieNightNomination = ({ socketId, id }) => {
  const movieNight = getSocketMovieNightState(socketId);
  const nextNominations = movieNight.nominations
    .filter((nomination) => String(nomination.id) !== String(id));

  if (nextNominations.length === movieNight.nominations.length) {
    return false;
  }

  movieNight.nominations = nextNominations;
  return true;
};

export const addMovieNightPlaylistItem = ({ socketId, item }) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (movieNight.playlist.length >= MAX_MOVIENIGHT_PLAYLIST_ITEMS_PER_ROOM) {
    return false;
  }

  const sanitized = sanitizeMovieNightMediaItem({
    item,
    id: movieNight.nextPlaylistItemId,
    requirePlayable: true,
  });

  if (!sanitized || !sanitized.playlistKey) {
    return false;
  }

  if (movieNight.playlist.some((existing) => existing.playlistKey === sanitized.playlistKey)) {
    return false;
  }

  movieNight.playlist.push(sanitized);
  movieNight.nextPlaylistItemId += 1;
  return true;
};

export const removeMovieNightPlaylistItem = ({ socketId, id }) => {
  const movieNight = getSocketMovieNightState(socketId);
  const nextPlaylist = movieNight.playlist.filter((item) => String(item.id) !== String(id));

  if (nextPlaylist.length === movieNight.playlist.length) {
    return false;
  }

  movieNight.playlist = nextPlaylist;

  if (movieNight.activePlaylistItem && String(movieNight.activePlaylistItem.id) === String(id)) {
    movieNight.activePlaylistItem = null;
  }

  return true;
};

const moveMovieNightPlaylistItem = ({ socketId, id, offset }) => {
  const movieNight = getSocketMovieNightState(socketId);
  const index = movieNight.playlist.findIndex((item) => String(item.id) === String(id));
  const newIndex = index + offset;

  if (index < 0 || newIndex < 0 || newIndex >= movieNight.playlist.length) {
    return false;
  }

  const playlist = movieNight.playlist.slice();
  const [item] = playlist.splice(index, 1);
  playlist.splice(newIndex, 0, item);
  movieNight.playlist = playlist;
  return true;
};

export const moveMovieNightPlaylistItemUp = ({ socketId, id }) => (
  moveMovieNightPlaylistItem({ socketId, id, offset: -1 })
);

export const moveMovieNightPlaylistItemDown = ({ socketId, id }) => (
  moveMovieNightPlaylistItem({ socketId, id, offset: 1 })
);

export const clearMovieNightPlaylist = (socketId) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (movieNight.playlist.length === 0 && !movieNight.activePlaylistItem) {
    return false;
  }

  movieNight.playlist = [];
  movieNight.activePlaylistItem = null;
  return true;
};

export const setMovieNightPlaylistVisibility = ({ socketId, visibility }) => {
  if (!['private', 'next', 'public'].includes(visibility)) {
    return false;
  }

  const movieNight = getSocketMovieNightState(socketId);
  if (movieNight.playlistVisibility === visibility) {
    return false;
  }

  movieNight.playlistVisibility = visibility;
  return true;
};

export const setMovieNightPlaylistAutoPlay = ({ socketId, playlistAutoPlay }) => {
  const movieNight = getSocketMovieNightState(socketId);
  const nextPlaylistAutoPlay = Boolean(playlistAutoPlay);

  if (movieNight.playlistAutoPlay === nextPlaylistAutoPlay) {
    return false;
  }

  movieNight.playlistAutoPlay = nextPlaylistAutoPlay;
  return true;
};

export const setMovieNightActivePlaylistItem = ({ socketId, item }) => {
  const movieNight = getSocketMovieNightState(socketId);
  const activePlaylistItem = sanitizeMovieNightActivePlaylistItem(item);

  if (activePlaylistItem === undefined) {
    return false;
  }

  movieNight.activePlaylistItem = activePlaylistItem;
  return true;
};

const createApprovalPollFromNominations = (movieNight) => ({
  id: movieNight.nextPollId,
  source: 'nominations',
  mode: 'approval',
  status: 'open',
  candidates: movieNight.nominations
    .slice(0, MAX_MOVIENIGHT_POLL_OPTIONS)
    .map((nomination) => ({ ...nomination })),
  votesBySocketId: {},
  round: 1,
  createdAt: new Date().toISOString(),
  closedAt: null,
});

const getMovieNightPollResults = (poll) => {
  const votesBySocketId = poll.votesBySocketId || {};
  const validCandidateIds = new Set(poll.candidates.map((candidate) => String(candidate.id)));
  const approvals = Object.values(votesBySocketId)
    .flat()
    .filter((candidateId) => validCandidateIds.has(String(candidateId)));

  return poll.candidates
    .map((candidate) => ({
      ...candidate,
      approvalCount: approvals
        .filter((candidateId) => String(candidateId) === String(candidate.id)).length,
    }))
    .sort((a, b) => b.approvalCount - a.approvalCount);
};

const normalizeRunoffLimit = (limit) => {
  const parsedLimit = Number(limit);

  if (!Number.isFinite(parsedLimit)) {
    return 2;
  }

  return Math.max(2, Math.min(5, Math.floor(parsedLimit)));
};

const createApprovalPollRunoff = ({ movieNight, limit }) => {
  if (!movieNight.activePoll || movieNight.activePoll.status !== 'closed') {
    return null;
  }

  const candidates = getMovieNightPollResults(movieNight.activePoll)
    .slice(0, Math.min(normalizeRunoffLimit(limit), MAX_MOVIENIGHT_POLL_OPTIONS))
    .map((candidate) => {
      const clone = { ...candidate };
      delete clone.approvalCount;
      return clone;
    });

  if (candidates.length < 2) {
    return null;
  }

  return {
    id: movieNight.nextPollId,
    source: 'runoff',
    sourcePollId: movieNight.activePoll.id,
    mode: 'approval',
    status: 'open',
    candidates,
    votesBySocketId: {},
    round: (movieNight.activePoll.round || 1) + 1,
    createdAt: new Date().toISOString(),
    closedAt: null,
  };
};

export const startMovieNightApprovalPollFromNominations = ({ socketId }) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (movieNight.nominations.length === 0) {
    return false;
  }

  movieNight.activePoll = createApprovalPollFromNominations(movieNight);
  movieNight.nextPollId += 1;
  return true;
};

export const setMovieNightPollApproval = ({
  socketId, candidateId, approved,
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const { activePoll } = movieNight;

  if (!activePoll || activePoll.status !== 'open') {
    return false;
  }

  const candidate = activePoll.candidates
    .find((pollCandidate) => String(pollCandidate.id) === String(candidateId));

  if (!candidate) {
    return false;
  }

  const approvals = (activePoll.votesBySocketId[socketId] || [])
    .filter((approvedCandidateId) => activePoll.candidates
      .some((pollCandidate) => String(pollCandidate.id) === String(approvedCandidateId)));
  const normalizedCandidateId = candidate.id;
  const hadApproval = approvals
    .some((approvedCandidateId) => String(approvedCandidateId) === String(normalizedCandidateId));
  const nextApprovals = approvals
    .filter((approvedCandidateId) => String(approvedCandidateId) !== String(normalizedCandidateId));

  if (approved) {
    nextApprovals.push(normalizedCandidateId);
  }

  const hasApproval = nextApprovals
    .some((approvedCandidateId) => String(approvedCandidateId) === String(normalizedCandidateId));
  if (hadApproval === hasApproval) {
    return false;
  }

  if (nextApprovals.length > 0) {
    activePoll.votesBySocketId[socketId] = nextApprovals;
  } else {
    delete activePoll.votesBySocketId[socketId];
  }

  return true;
};

export const closeMovieNightPoll = ({ socketId }) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (!movieNight.activePoll || movieNight.activePoll.status !== 'open') {
    return false;
  }

  movieNight.activePoll.status = 'closed';
  movieNight.activePoll.closedAt = new Date().toISOString();
  return true;
};

export const startMovieNightPollRunoff = ({ socketId, limit }) => {
  const movieNight = getSocketMovieNightState(socketId);
  const runoffPoll = createApprovalPollRunoff({ movieNight, limit });

  if (!runoffPoll) {
    return false;
  }

  movieNight.activePoll = runoffPoll;
  movieNight.nextPollId += 1;
  return true;
};

export const clearMovieNightPoll = ({ socketId }) => {
  const movieNight = getSocketMovieNightState(socketId);

  if (!movieNight.activePoll) {
    return false;
  }

  movieNight.activePoll = null;
  return true;
};

export const getRoomCount = () => rooms.size;
