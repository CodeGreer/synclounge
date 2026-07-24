#!/usr/bin/env node
const slPlayerClientId = 'slplayer';
const pendingPlayMediaOriginMaxAgeMs = 30000;

const media = {
  ratingKey: 'movie-b',
  key: '/library/metadata/movie-b',
  machineIdentifier: 'server-1',
};

const makeTimeline = ({ commandID = 11, playQueueItemID = 700, ratingKey = 'movie-b' } = {}) => ({
  machineIdentifier: 'server-1',
  playQueueID: 77,
  playQueueItemID,
  commandID,
  state: 'playing',
  time: 1000,
  duration: 60000,
  ratingKey,
});

const makeStore = () => {
  const events = [];
  const state = {
    chosenClientId: 'external-client',
    commandId: 10,
    activePlayQueue: null,
    activePlayQueueMachineIdentifier: null,
    activeMediaMetadata: null,
    activeServerId: null,
    plexClientTimeline: null,
    pendingPlayMediaOrigin: null,
  };

  const getters = {
    get GET_CHOSEN_CLIENT_ID() { return state.chosenClientId; },
    get GET_COMMAND_ID() { return state.commandId; },
    get GET_ACTIVE_PLAY_QUEUE() { return state.activePlayQueue; },
    get GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER() { return state.activePlayQueueMachineIdentifier; },
    get GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM() {
      return state.activePlayQueue?.Metadata[state.activePlayQueue.playQueueSelectedItemOffset] || null;
    },
    get GET_PENDING_PLAY_MEDIA_ORIGIN() { return state.pendingPlayMediaOrigin; },
    get GET_PLEX_CLIENT_TIMELINE() { return state.plexClientTimeline; },
  };

  const commit = (type, payload) => {
    if (type === 'SET_ACTIVE_PLAY_QUEUE') state.activePlayQueue = payload;
    if (type === 'SET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER') state.activePlayQueueMachineIdentifier = payload;
    if (type === 'SET_PENDING_PLAY_MEDIA_ORIGIN') state.pendingPlayMediaOrigin = payload;
    if (type === 'SET_LAST_PLAY_MEDIA_COMMAND_ID') state.lastPlayMediaCommandId = payload;
    if (type === 'SET_PLEX_CLIENT_TIMELINE') state.plexClientTimeline = payload;
    if (type === 'SET_ACTIVE_MEDIA_METADATA') state.activeMediaMetadata = payload;
    if (type === 'SET_ACTIVE_SERVER_ID') state.activeServerId = payload;
  };

  const consumePendingPlayMediaOrigin = (timeline) => {
    const origin = getters.GET_PENDING_PLAY_MEDIA_ORIGIN;
    if (!origin || Date.now() - origin.createdAt > pendingPlayMediaOriginMaxAgeMs) {
      commit('SET_PENDING_PLAY_MEDIA_ORIGIN', null);
      return null;
    }

    if (timeline.commandID < origin.commandId
      || timeline.machineIdentifier !== origin.machineIdentifier
      || String(timeline.playQueueItemID) !== String(origin.playQueueItemID)) {
      commit('SET_PENDING_PLAY_MEDIA_ORIGIN', null);
      return null;
    }

    commit('SET_PENDING_PLAY_MEDIA_ORIGIN', null);
    return origin.userInitiated;
  };

  const dispatch = async (type, payload) => {
    if (type === 'plexservers/CREATE_PLAY_QUEUE') {
      return {
        playQueueID: 77,
        playQueueSelectedItemOffset: 0,
        Metadata: [{ ...media, playQueueItemID: 700 }],
      };
    }

    if (type === 'SEND_CHOSEN_CLIENT_REQUEST') {
      events.push({ type, payload });
      return null;
    }

    if (type === 'plexservers/FETCH_PLAY_QUEUE') {
      return {
        playQueueID: payload.playQueueID,
        playQueueSelectedItemOffset: 0,
        Metadata: [{ ...media, ratingKey: payload.ratingKey || media.ratingKey, playQueueItemID: 700 }],
      };
    }

    if (type === 'UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM') {
      commit('SET_ACTIVE_MEDIA_METADATA', getters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM);
      commit('SET_ACTIVE_SERVER_ID', getters.GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER);
      return null;
    }

    if (type === 'CONSUME_PENDING_PLAY_MEDIA_ORIGIN') {
      return consumePendingPlayMediaOrigin(payload);
    }

    if (type === 'synclounge/PROCESS_MEDIA_UPDATE') {
      events.push({ type, userInitiated: payload });
      return null;
    }

    if (type === 'DISPLAY_NOTIFICATION') return null;
    throw new Error(`Unexpected dispatch: ${type}`);
  };

  const rootGetters = {
    'plexservers/GET_PLEX_SERVER': () => ({
      name: 'Server 1',
      accessToken: 'redacted-token',
      chosenConnection: {
        address: '127.0.0.1',
        port: 32400,
        protocol: 'http',
        uri: 'http://127.0.0.1:32400',
      },
    }),
    'synclounge/IS_IN_ROOM': true,
  };

  const playMedia = async ({ userInitiated }) => {
    const machineIdentifier = media.machineIdentifier;
    const commandId = getters.GET_COMMAND_ID;
    commit('SET_ACTIVE_PLAY_QUEUE', await dispatch('plexservers/CREATE_PLAY_QUEUE', {
      machineIdentifier,
      ratingKey: media.ratingKey,
    }));
    commit('SET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER', machineIdentifier);

    if (getters.GET_CHOSEN_CLIENT_ID === slPlayerClientId) {
      throw new Error('This regression must exercise an external Plex client');
    }

    const server = rootGetters['plexservers/GET_PLEX_SERVER'](machineIdentifier);
    await dispatch('SEND_CHOSEN_CLIENT_REQUEST', {
      path: '/player/playback/playMedia',
      params: {
        key: media.key,
        machineIdentifier,
        token: server.accessToken,
        containerKey: `/playQueues/${getters.GET_ACTIVE_PLAY_QUEUE.playQueueID}`,
      },
    });
    commit('SET_LAST_PLAY_MEDIA_COMMAND_ID', commandId);
    commit('SET_PENDING_PLAY_MEDIA_ORIGIN', {
      commandId,
      machineIdentifier,
      playQueueItemID: getters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM.playQueueItemID,
      userInitiated,
      createdAt: Date.now(),
    });
  };

  const updatePlexClientTimeline = async (timeline) => {
    if (!getters.GET_PLEX_CLIENT_TIMELINE
      || getters.GET_PLEX_CLIENT_TIMELINE.machineIdentifier !== timeline.machineIdentifier
      || !getters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM
      || getters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM.playQueueItemID !== timeline.playQueueItemID) {
      commit('SET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER', timeline.machineIdentifier);
      commit('SET_ACTIVE_PLAY_QUEUE', await dispatch('plexservers/FETCH_PLAY_QUEUE', {
        machineIdentifier: getters.GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER,
        playQueueID: timeline.playQueueID,
        ratingKey: timeline.ratingKey,
      }));
      await dispatch('UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
      commit('SET_PLEX_CLIENT_TIMELINE', timeline);
      const mediaChangeOrigin = await dispatch('CONSUME_PENDING_PLAY_MEDIA_ORIGIN', timeline);
      await dispatch('synclounge/PROCESS_MEDIA_UPDATE', mediaChangeOrigin);
    }
  };

  return { state, events, playMedia, updatePlexClientTimeline };
};

(async () => {
  const syncStore = makeStore();
  await syncStore.playMedia({ userInitiated: false });
  await syncStore.updatePlexClientTimeline(makeTimeline());
  const syncUpdate = syncStore.events.find((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE');
  if (!syncUpdate || syncUpdate.userInitiated !== false) {
    throw new Error('Sync-A-Rama-issued external PLAY_MEDIA poll should emit explicit false');
  }
  if (syncStore.state.pendingPlayMediaOrigin !== null) {
    throw new Error('Matching pending origin should be consumed');
  }

  const laterExternalStore = makeStore();
  await laterExternalStore.playMedia({ userInitiated: false });
  await laterExternalStore.updatePlexClientTimeline(makeTimeline({ playQueueItemID: 701, ratingKey: 'movie-c' }));
  const unrelatedUpdate = laterExternalStore.events.find((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE');
  if (!unrelatedUpdate || unrelatedUpdate.userInitiated !== null) {
    throw new Error('Unrelated external media change should remain null and Auto-Host eligible');
  }
  if (laterExternalStore.state.pendingPlayMediaOrigin !== null) {
    throw new Error('Unrelated media change should clear stale pending origin');
  }

  const expiredStore = makeStore();
  await expiredStore.playMedia({ userInitiated: false });
  expiredStore.state.pendingPlayMediaOrigin.createdAt -= pendingPlayMediaOriginMaxAgeMs + 1;
  await expiredStore.updatePlexClientTimeline(makeTimeline());
  const expiredUpdate = expiredStore.events.find((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE');
  if (!expiredUpdate || expiredUpdate.userInitiated !== null) {
    throw new Error('Expired pending origin should not classify later media changes as sync-directed');
  }

  console.log('PASS Auto-Host external Plex client flow checks');
})().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
