"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateUserSyncFlexibility = exports.updateUserPlayerState = exports.updateUserMedia = exports.updateSocketLatency = exports.startMovieNightPollRunoff = exports.startMovieNightApprovalPollFromNominations = exports.setSocketLatencyIntervalId = exports.setMovieNightPollApproval = exports.setMovieNightPlaylistVisibility = exports.setMovieNightPlaylistAutoPlay = exports.setMovieNightActivePlaylistItem = exports.setIsPartyPausingEnabledInSocketRoom = exports.setIsAutoHostEnabledInSocketRoom = exports.removeUser = exports.removeSocketLatencyData = exports.removeRoom = exports.removeMovieNightPlaylistItem = exports.removeMovieNightNomination = exports.moveMovieNightPlaylistItemUp = exports.moveMovieNightPlaylistItemDown = exports.makeUserHost = exports.isUserInRoom = exports.isUserInARoom = exports.isUserHost = exports.isRoomEmpty = exports.isPartyPausingEnabledInSocketRoom = exports.isAutoHostEnabledInSocketRoom = exports.initSocketLatencyData = exports.getUserRoomId = exports.getUserRoom = exports.getSocketPingSecret = exports.getSocketLatency = exports.getSocketCount = exports.getRoomUserData = exports.getRoomSocketIds = exports.getRoomSize = exports.getRoomHostId = exports.getRoomCount = exports.getMovieNightState = exports.getJoinedUserCount = exports.getJoinData = exports.getHealth = exports.getAnySocketIdInRoom = exports.generateAndSetSocketLatencySecret = exports.formatUserData = exports.doesSocketHaveRtt = exports.doesRoomExist = exports.createRoom = exports.closeMovieNightPoll = exports.clearSocketLatencyInterval = exports.clearMovieNightPoll = exports.clearMovieNightPlaylist = exports.addUserToRoom = exports.addMovieNightPlaylistItem = exports.addMovieNightNomination = exports.MAX_MOVIENIGHT_USERNAME_LENGTH = exports.MAX_MOVIENIGHT_TYPE_LENGTH = exports.MAX_MOVIENIGHT_TITLE_LENGTH = exports.MAX_MOVIENIGHT_SUMMARY_LENGTH = exports.MAX_MOVIENIGHT_RATING_KEY_LENGTH = exports.MAX_MOVIENIGHT_POLL_OPTIONS = exports.MAX_MOVIENIGHT_PLAYLIST_ITEMS_PER_ROOM = exports.MAX_MOVIENIGHT_NOMINATIONS_PER_ROOM = exports.MAX_MOVIENIGHT_MACHINE_IDENTIFIER_LENGTH = exports.MAX_MOVIENIGHT_IMAGE_URL_LENGTH = exports.MAX_MOVIENIGHT_ID_LENGTH = void 0;
var _uuid = require("uuid");
const _excluded = ["recipientId", "updatedAt", "playbackRate", "state", "time"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const MAX_MOVIENIGHT_NOMINATIONS_PER_ROOM = exports.MAX_MOVIENIGHT_NOMINATIONS_PER_ROOM = 100;
const MAX_MOVIENIGHT_PLAYLIST_ITEMS_PER_ROOM = exports.MAX_MOVIENIGHT_PLAYLIST_ITEMS_PER_ROOM = 100;
const MAX_MOVIENIGHT_POLL_OPTIONS = exports.MAX_MOVIENIGHT_POLL_OPTIONS = 50;
const MAX_MOVIENIGHT_TITLE_LENGTH = exports.MAX_MOVIENIGHT_TITLE_LENGTH = 300;
const MAX_MOVIENIGHT_USERNAME_LENGTH = exports.MAX_MOVIENIGHT_USERNAME_LENGTH = 80;
const MAX_MOVIENIGHT_ID_LENGTH = exports.MAX_MOVIENIGHT_ID_LENGTH = 120;
const MAX_MOVIENIGHT_IMAGE_URL_LENGTH = exports.MAX_MOVIENIGHT_IMAGE_URL_LENGTH = 1000;
const MAX_MOVIENIGHT_SUMMARY_LENGTH = exports.MAX_MOVIENIGHT_SUMMARY_LENGTH = 2000;
const MAX_MOVIENIGHT_RATING_KEY_LENGTH = exports.MAX_MOVIENIGHT_RATING_KEY_LENGTH = 120;
const MAX_MOVIENIGHT_MACHINE_IDENTIFIER_LENGTH = exports.MAX_MOVIENIGHT_MACHINE_IDENTIFIER_LENGTH = 120;
const MAX_MOVIENIGHT_TYPE_LENGTH = exports.MAX_MOVIENIGHT_TYPE_LENGTH = 80;
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
const normalizeNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};
const normalizeMovieNightId = value => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = truncateString(String(value || ''), MAX_MOVIENIGHT_ID_LENGTH);
  return normalized || null;
};
const sanitizeMovieNightMediaItem = ({
  item,
  id,
  requirePlayable = false
}) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }
  const source = truncateString(item.source, MAX_MOVIENIGHT_TYPE_LENGTH) || 'manual';
  const title = truncateString(item.title, MAX_MOVIENIGHT_TITLE_LENGTH);
  const type = truncateString(item.type, MAX_MOVIENIGHT_TYPE_LENGTH);
  const ratingKey = truncateString(item.ratingKey, MAX_MOVIENIGHT_RATING_KEY_LENGTH);
  const machineIdentifier = truncateString(item.machineIdentifier, MAX_MOVIENIGHT_MACHINE_IDENTIFIER_LENGTH);
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
    duration: normalizeNumber(item.duration)
  };
  if (nominationKey) {
    sanitized.nominationKey = nominationKey;
  }
  if (playlistKey) {
    sanitized.playlistKey = playlistKey;
  }
  return Object.fromEntries(Object.entries(sanitized).filter(([, value]) => value != null));
};
const sanitizeMovieNightActivePlaylistItem = item => {
  if (!item) {
    return null;
  }
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return undefined;
  }
  const id = normalizeMovieNightId(item.id);
  const playlistKey = truncateString(item.playlistKey, MAX_MOVIENIGHT_ID_LENGTH);
  const machineIdentifier = truncateString(item.machineIdentifier, MAX_MOVIENIGHT_MACHINE_IDENTIFIER_LENGTH);
  const ratingKey = truncateString(item.ratingKey, MAX_MOVIENIGHT_RATING_KEY_LENGTH);
  if (!id && !playlistKey && (!machineIdentifier || !ratingKey)) {
    return undefined;
  }
  return Object.fromEntries(Object.entries({
    id,
    playlistKey,
    machineIdentifier,
    ratingKey
  }).filter(([, value]) => value != null));
};
const rooms = new Map();
// Map from socket id to room name
const socketRoomId = new Map();
const socketLatencyData = new Map();
const getNumberFromUsername = username => {
  const match = username.match(/\((\d+)\)$/);
  return match ? parseInt(match[1], 10) : null;
};
const sanitizeUsername = username => truncateString(username, MAX_MOVIENIGHT_USERNAME_LENGTH) || 'Guest';
const getUserRoomId = socketId => socketRoomId.get(socketId);
exports.getUserRoomId = getUserRoomId;
const getUserRoom = socketId => rooms.get(getUserRoomId(socketId));
exports.getUserRoom = getUserRoom;
const getRoomUserData = socketId => getUserRoom(socketId).users.get(socketId);
exports.getRoomUserData = getRoomUserData;
const createMovieNightState = () => ({
  nextNominationId: 1,
  nextPlaylistItemId: 1,
  nextPollId: 1,
  nominations: [],
  playlist: [],
  playlistVisibility: 'next',
  playlistAutoPlay: false,
  activePlaylistItem: null,
  activePoll: null
});
const cloneMovieNightPoll = poll => poll ? _objectSpread(_objectSpread({}, poll), {}, {
  candidates: poll.candidates.map(candidate => _objectSpread({}, candidate)),
  votesBySocketId: Object.entries(poll.votesBySocketId || {}).reduce((votes, [socketId, candidateIds]) => _objectSpread(_objectSpread({}, votes), {}, {
    [socketId]: candidateIds.slice()
  }), {})
}) : null;
const cloneMovieNightState = movieNight => ({
  nextNominationId: movieNight.nextNominationId,
  nextPlaylistItemId: movieNight.nextPlaylistItemId,
  nextPollId: movieNight.nextPollId,
  nominations: movieNight.nominations.map(nomination => _objectSpread({}, nomination)),
  playlist: movieNight.playlist.map(item => _objectSpread({}, item)),
  playlistVisibility: movieNight.playlistVisibility,
  playlistAutoPlay: Boolean(movieNight.playlistAutoPlay),
  activePlaylistItem: movieNight.activePlaylistItem ? _objectSpread({}, movieNight.activePlaylistItem) : null,
  activePoll: cloneMovieNightPoll(movieNight.activePoll)
});
const getSocketMovieNightState = socketId => getUserRoom(socketId).movieNight;
const getUniqueUsername = ({
  usernames,
  desiredUsername
}) => {
  const safeDesiredUsername = sanitizeUsername(desiredUsername);
  if (!usernames.includes(safeDesiredUsername)) {
    return safeDesiredUsername;
  }

  // Get users with same username that are numbered like:  username(1)
  const userNumbers = usernames.filter(username => username.startsWith("".concat(safeDesiredUsername, "("))).map(getNumberFromUsername).filter(number => number != null);
  if (userNumbers.length > 0) {
    const nextNumber = Math.max(...userNumbers) + 1;
    return "".concat(safeDesiredUsername, "(").concat(nextNumber, ")");
  }
  return "".concat(safeDesiredUsername, "(1)");
};
const getSocketLatency = socketId => socketLatencyData.get(socketId).rtt / 2;
exports.getSocketLatency = getSocketLatency;
const updateUserPlayerState = ({
  socketId,
  state,
  time,
  duration,
  playbackRate
}) => {
  const userRoomData = getRoomUserData(socketId);
  userRoomData.state = state;
  // Adjust time by sender's latency
  userRoomData.time = state === 'playing' ? time + getSocketLatency(socketId) : time;
  userRoomData.duration = duration;
  userRoomData.playbackRate = playbackRate;
  userRoomData.updatedAt = Date.now();
};
exports.updateUserPlayerState = updateUserPlayerState;
const updateUserMedia = ({
  socketId,
  media
}) => {
  const userRoomData = getRoomUserData(socketId);
  userRoomData.media = media;
};
exports.updateUserMedia = updateUserMedia;
const updateUserSyncFlexibility = ({
  socketId,
  syncFlexibility
}) => {
  const userRoomData = getRoomUserData(socketId);
  userRoomData.syncFlexibility = syncFlexibility;
};
exports.updateUserSyncFlexibility = updateUserSyncFlexibility;
const addUserToRoom = ({
  socketId,
  roomId,
  desiredUsername,
  thumb,
  playerProduct
}) => {
  const {
    users
  } = rooms.get(roomId);
  const usernames = [...users.values()].map(user => user.username);
  socketRoomId.set(socketId, roomId);
  users.set(socketId, {
    username: getUniqueUsername({
      usernames,
      desiredUsername
    }),
    thumb,
    playerProduct
  });
};
exports.addUserToRoom = addUserToRoom;
const createRoom = ({
  id,
  isPartyPausingEnabled,
  isAutoHostEnabled,
  hostId
}) => {
  rooms.set(id, {
    isPartyPausingEnabled,
    isAutoHostEnabled,
    hostId,
    movieNight: createMovieNightState(),
    users: new Map()
  });
};
exports.createRoom = createRoom;
const isUserInARoom = socketId => socketRoomId.has(socketId);
exports.isUserInARoom = isUserInARoom;
const doesRoomExist = roomId => rooms.has(roomId);
exports.doesRoomExist = doesRoomExist;
const getRoomSocketIds = roomId => [...rooms.get(roomId).users.keys()];
exports.getRoomSocketIds = getRoomSocketIds;
const formatUserData = _ref => {
  let {
      recipientId,
      updatedAt,
      playbackRate,
      state,
      time
    } = _ref,
    rest = _objectWithoutProperties(_ref, _excluded);
  return _objectSpread(_objectSpread({}, rest), {}, {
    playbackRate,
    state,
    // Adjust time by age if playing
    time: state === 'playing' ? time + (getSocketLatency(recipientId) + Date.now() - updatedAt) * playbackRate : time
  });
};
exports.formatUserData = formatUserData;
const getOtherUserData = ({
  roomId,
  exceptSocketId
}) => Object.fromEntries([...rooms.get(roomId).users].filter(([socketId]) => socketId !== exceptSocketId).map(([id, data]) => [id, formatUserData(_objectSpread({
  recipientId: exceptSocketId
}, data))]));
const getRoomHostId = roomId => rooms.get(roomId).hostId;
exports.getRoomHostId = getRoomHostId;
const getJoinData = ({
  roomId,
  socketId
}) => {
  const {
    username
  } = getRoomUserData(socketId);
  const {
    isPartyPausingEnabled,
    isAutoHostEnabled,
    movieNight
  } = rooms.get(roomId);
  return {
    isPartyPausingEnabled,
    isAutoHostEnabled,
    movieNight: cloneMovieNightState(movieNight),
    hostId: getRoomHostId(roomId),
    user: {
      id: socketId,
      username
    },
    users: getOtherUserData({
      roomId,
      exceptSocketId: socketId
    })
  };
};
exports.getJoinData = getJoinData;
const removeUser = socketId => {
  rooms.get(getUserRoomId(socketId)).users["delete"](socketId);
  socketRoomId["delete"](socketId);
};
exports.removeUser = removeUser;
const removeRoom = roomId => {
  rooms["delete"](roomId);
};
exports.removeRoom = removeRoom;
const isUserHost = socketId => getUserRoom(socketId).hostId === socketId;
exports.isUserHost = isUserHost;
const getRoomSize = roomId => rooms.get(roomId).users.size;
exports.getRoomSize = getRoomSize;
const isRoomEmpty = roomId => getRoomSize(roomId) <= 0;
exports.isRoomEmpty = isRoomEmpty;
const getAnySocketIdInRoom = roomId => rooms.get(roomId).users.keys().next().value;
exports.getAnySocketIdInRoom = getAnySocketIdInRoom;
const makeUserHost = socketId => {
  getUserRoom(socketId).hostId = socketId;
};
exports.makeUserHost = makeUserHost;
const isUserInRoom = ({
  roomId,
  socketId
}) => rooms.get(roomId).users.has(socketId);
exports.isUserInRoom = isUserInRoom;
const getSocketPingSecret = socketId => {
  var _socketLatencyData$ge;
  return (_socketLatencyData$ge = socketLatencyData.get(socketId)) === null || _socketLatencyData$ge === void 0 ? void 0 : _socketLatencyData$ge.secret;
};
exports.getSocketPingSecret = getSocketPingSecret;
const updateSocketLatency = socketId => {
  const latencyData = socketLatencyData.get(socketId);

  // TODO: potentially smooth it? or also measure variance?
  latencyData.rtt = Date.now() - latencyData.sentAt;

  // Reset secret
  latencyData.secret = null;
};
exports.updateSocketLatency = updateSocketLatency;
const generateAndSetSocketLatencySecret = socketId => {
  const secret = (0, _uuid.v4)();
  const latencyData = socketLatencyData.get(socketId);
  latencyData.secret = secret;
  latencyData.sentAt = Date.now();
  return secret;
};
exports.generateAndSetSocketLatencySecret = generateAndSetSocketLatencySecret;
const setSocketLatencyIntervalId = ({
  socketId,
  intervalId
}) => {
  socketLatencyData.get(socketId).intervalId = intervalId;
};
exports.setSocketLatencyIntervalId = setSocketLatencyIntervalId;
const doesSocketHaveRtt = socketId => {
  var _socketLatencyData$ge2;
  return ((_socketLatencyData$ge2 = socketLatencyData.get(socketId)) === null || _socketLatencyData$ge2 === void 0 ? void 0 : _socketLatencyData$ge2.rtt) != null;
};
exports.doesSocketHaveRtt = doesSocketHaveRtt;
const initSocketLatencyData = socketId => {
  socketLatencyData.set(socketId, {});
};
exports.initSocketLatencyData = initSocketLatencyData;
const removeSocketLatencyData = socketId => {
  socketLatencyData["delete"](socketId);
};
exports.removeSocketLatencyData = removeSocketLatencyData;
const setIsPartyPausingEnabledInSocketRoom = ({
  socketId,
  isPartyPausingEnabled
}) => {
  getUserRoom(socketId).isPartyPausingEnabled = isPartyPausingEnabled;
};
exports.setIsPartyPausingEnabledInSocketRoom = setIsPartyPausingEnabledInSocketRoom;
const setIsAutoHostEnabledInSocketRoom = ({
  socketId,
  isAutoHostEnabled
}) => {
  getUserRoom(socketId).isAutoHostEnabled = isAutoHostEnabled;
};
exports.setIsAutoHostEnabledInSocketRoom = setIsAutoHostEnabledInSocketRoom;
const isPartyPausingEnabledInSocketRoom = socketId => getUserRoom(socketId).isPartyPausingEnabled;
exports.isPartyPausingEnabledInSocketRoom = isPartyPausingEnabledInSocketRoom;
const isAutoHostEnabledInSocketRoom = socketId => getUserRoom(socketId).isAutoHostEnabled;
exports.isAutoHostEnabledInSocketRoom = isAutoHostEnabledInSocketRoom;
const clearSocketLatencyInterval = socketId => {
  clearInterval(socketLatencyData.get(socketId).intervalId);
};
exports.clearSocketLatencyInterval = clearSocketLatencyInterval;
const getJoinedUserCount = () => socketRoomId.size;
exports.getJoinedUserCount = getJoinedUserCount;
const getLoad = () => {
  if (getJoinedUserCount() < 25) {
    return 'low';
  }
  if (getJoinedUserCount() < 50) {
    return 'medium';
  }
  return 'high';
};
const getHealth = () => ({
  load: getLoad()
});
exports.getHealth = getHealth;
const getSocketCount = () => socketLatencyData.size;
exports.getSocketCount = getSocketCount;
const getMovieNightState = roomId => cloneMovieNightState(rooms.get(roomId).movieNight);
exports.getMovieNightState = getMovieNightState;
const addMovieNightNomination = ({
  socketId,
  nomination
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  if (movieNight.nominations.length >= MAX_MOVIENIGHT_NOMINATIONS_PER_ROOM) {
    return false;
  }
  const sanitized = sanitizeMovieNightMediaItem({
    item: nomination,
    id: movieNight.nextNominationId
  });
  if (!sanitized) {
    return false;
  }
  if (sanitized.nominationKey && movieNight.nominations.some(existing => existing.nominationKey === sanitized.nominationKey)) {
    return false;
  }
  movieNight.nominations.push(sanitized);
  movieNight.nextNominationId += 1;
  return true;
};
exports.addMovieNightNomination = addMovieNightNomination;
const removeMovieNightNomination = ({
  socketId,
  id
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const nextNominations = movieNight.nominations.filter(nomination => String(nomination.id) !== String(id));
  if (nextNominations.length === movieNight.nominations.length) {
    return false;
  }
  movieNight.nominations = nextNominations;
  return true;
};
exports.removeMovieNightNomination = removeMovieNightNomination;
const addMovieNightPlaylistItem = ({
  socketId,
  item
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  if (movieNight.playlist.length >= MAX_MOVIENIGHT_PLAYLIST_ITEMS_PER_ROOM) {
    return false;
  }
  const sanitized = sanitizeMovieNightMediaItem({
    item,
    id: movieNight.nextPlaylistItemId,
    requirePlayable: true
  });
  if (!sanitized || !sanitized.playlistKey) {
    return false;
  }
  if (movieNight.playlist.some(existing => existing.playlistKey === sanitized.playlistKey)) {
    return false;
  }
  movieNight.playlist.push(sanitized);
  movieNight.nextPlaylistItemId += 1;
  return true;
};
exports.addMovieNightPlaylistItem = addMovieNightPlaylistItem;
const removeMovieNightPlaylistItem = ({
  socketId,
  id
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const nextPlaylist = movieNight.playlist.filter(item => String(item.id) !== String(id));
  if (nextPlaylist.length === movieNight.playlist.length) {
    return false;
  }
  movieNight.playlist = nextPlaylist;
  return true;
};
exports.removeMovieNightPlaylistItem = removeMovieNightPlaylistItem;
const moveMovieNightPlaylistItem = ({
  socketId,
  id,
  offset
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const index = movieNight.playlist.findIndex(item => String(item.id) === String(id));
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
const moveMovieNightPlaylistItemUp = ({
  socketId,
  id
}) => moveMovieNightPlaylistItem({
  socketId,
  id,
  offset: -1
});
exports.moveMovieNightPlaylistItemUp = moveMovieNightPlaylistItemUp;
const moveMovieNightPlaylistItemDown = ({
  socketId,
  id
}) => moveMovieNightPlaylistItem({
  socketId,
  id,
  offset: 1
});
exports.moveMovieNightPlaylistItemDown = moveMovieNightPlaylistItemDown;
const clearMovieNightPlaylist = socketId => {
  const movieNight = getSocketMovieNightState(socketId);
  if (movieNight.playlist.length === 0 && !movieNight.activePlaylistItem) {
    return false;
  }
  movieNight.playlist = [];
  movieNight.activePlaylistItem = null;
  return true;
};
exports.clearMovieNightPlaylist = clearMovieNightPlaylist;
const setMovieNightPlaylistVisibility = ({
  socketId,
  visibility
}) => {
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
exports.setMovieNightPlaylistVisibility = setMovieNightPlaylistVisibility;
const setMovieNightPlaylistAutoPlay = ({
  socketId,
  playlistAutoPlay
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const nextPlaylistAutoPlay = Boolean(playlistAutoPlay);
  if (movieNight.playlistAutoPlay === nextPlaylistAutoPlay) {
    return false;
  }
  movieNight.playlistAutoPlay = nextPlaylistAutoPlay;
  return true;
};
exports.setMovieNightPlaylistAutoPlay = setMovieNightPlaylistAutoPlay;
const setMovieNightActivePlaylistItem = ({
  socketId,
  item
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const activePlaylistItem = sanitizeMovieNightActivePlaylistItem(item);
  if (activePlaylistItem === undefined) {
    return false;
  }
  movieNight.activePlaylistItem = activePlaylistItem;
  return true;
};
exports.setMovieNightActivePlaylistItem = setMovieNightActivePlaylistItem;
const createApprovalPollFromNominations = movieNight => ({
  id: movieNight.nextPollId,
  source: 'nominations',
  mode: 'approval',
  status: 'open',
  candidates: movieNight.nominations.slice(0, MAX_MOVIENIGHT_POLL_OPTIONS).map(nomination => _objectSpread({}, nomination)),
  votesBySocketId: {},
  round: 1,
  createdAt: new Date().toISOString(),
  closedAt: null
});
const getMovieNightPollResults = poll => {
  const votesBySocketId = poll.votesBySocketId || {};
  const validCandidateIds = new Set(poll.candidates.map(candidate => String(candidate.id)));
  const approvals = Object.values(votesBySocketId).flat().filter(candidateId => validCandidateIds.has(String(candidateId)));
  return poll.candidates.map(candidate => _objectSpread(_objectSpread({}, candidate), {}, {
    approvalCount: approvals.filter(candidateId => String(candidateId) === String(candidate.id)).length
  })).sort((a, b) => b.approvalCount - a.approvalCount);
};
const normalizeRunoffLimit = limit => {
  const parsedLimit = Number(limit);
  if (!Number.isFinite(parsedLimit)) {
    return 2;
  }
  return Math.max(2, Math.min(5, Math.floor(parsedLimit)));
};
const createApprovalPollRunoff = ({
  movieNight,
  limit
}) => {
  if (!movieNight.activePoll || movieNight.activePoll.status !== 'closed') {
    return null;
  }
  const candidates = getMovieNightPollResults(movieNight.activePoll).slice(0, Math.min(normalizeRunoffLimit(limit), MAX_MOVIENIGHT_POLL_OPTIONS)).map(candidate => {
    const clone = _objectSpread({}, candidate);
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
    closedAt: null
  };
};
const startMovieNightApprovalPollFromNominations = ({
  socketId
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  if (movieNight.nominations.length === 0) {
    return false;
  }
  movieNight.activePoll = createApprovalPollFromNominations(movieNight);
  movieNight.nextPollId += 1;
  return true;
};
exports.startMovieNightApprovalPollFromNominations = startMovieNightApprovalPollFromNominations;
const setMovieNightPollApproval = ({
  socketId,
  candidateId,
  approved
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const {
    activePoll
  } = movieNight;
  if (!activePoll || activePoll.status !== 'open') {
    return false;
  }
  const candidate = activePoll.candidates.find(pollCandidate => String(pollCandidate.id) === String(candidateId));
  if (!candidate) {
    return false;
  }
  const approvals = (activePoll.votesBySocketId[socketId] || []).filter(approvedCandidateId => activePoll.candidates.some(pollCandidate => String(pollCandidate.id) === String(approvedCandidateId)));
  const normalizedCandidateId = candidate.id;
  const hadApproval = approvals.some(approvedCandidateId => String(approvedCandidateId) === String(normalizedCandidateId));
  const nextApprovals = approvals.filter(approvedCandidateId => String(approvedCandidateId) !== String(normalizedCandidateId));
  if (approved) {
    nextApprovals.push(normalizedCandidateId);
  }
  const hasApproval = nextApprovals.some(approvedCandidateId => String(approvedCandidateId) === String(normalizedCandidateId));
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
exports.setMovieNightPollApproval = setMovieNightPollApproval;
const closeMovieNightPoll = ({
  socketId
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  if (!movieNight.activePoll || movieNight.activePoll.status !== 'open') {
    return false;
  }
  movieNight.activePoll.status = 'closed';
  movieNight.activePoll.closedAt = new Date().toISOString();
  return true;
};
exports.closeMovieNightPoll = closeMovieNightPoll;
const startMovieNightPollRunoff = ({
  socketId,
  limit
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  const runoffPoll = createApprovalPollRunoff({
    movieNight,
    limit
  });
  if (!runoffPoll) {
    return false;
  }
  movieNight.activePoll = runoffPoll;
  movieNight.nextPollId += 1;
  return true;
};
exports.startMovieNightPollRunoff = startMovieNightPollRunoff;
const clearMovieNightPoll = ({
  socketId
}) => {
  const movieNight = getSocketMovieNightState(socketId);
  if (!movieNight.activePoll) {
    return false;
  }
  movieNight.activePoll = null;
  return true;
};
exports.clearMovieNightPoll = clearMovieNightPoll;
const getRoomCount = () => rooms.size;
exports.getRoomCount = getRoomCount;