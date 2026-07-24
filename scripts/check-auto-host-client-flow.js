#!/usr/bin/env node
const path = require('path');
const Module = require('module');

const fetchXmlCalls = [];

const makeDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const originalLoad = Module._load;
Module._load = function loadMocked(request, parent, isMain) {
  if (request === '@/utils/fetchutils') {
    return {
      fetchXmlAndTransform: (...args) => {
        const deferred = makeDeferred();
        fetchXmlCalls.push({ args, deferred });
        return deferred.promise;
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    return originalResolveFilename.call(
      this,
      path.join(process.cwd(), 'src', request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require('@babel/register')({
  extensions: ['.js'],
  ignore: [/node_modules/],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
});

const actions = require('../src/store/modules/plexclients/actions').default;
const stateFactory = require('../src/store/modules/plexclients/state').default;
const mutations = require('../src/store/modules/plexclients/mutations').default;
const gettersFactory = require('../src/store/modules/plexclients/getters').default;
const { slPlayerClientId } = require('../src/player/constants');

const media = {
  title: 'Movie B',
  type: 'movie',
  ratingKey: 'movie-b',
  key: '/library/metadata/movie-b',
  machineIdentifier: 'server-1',
};

const makeTimeline = ({ commandID = 12, playQueueItemID = 700, ratingKey = 'movie-b' } = {}) => ({
  machineIdentifier: 'server-1',
  playQueueID: 77,
  playQueueItemID,
  commandID,
  state: 'playing',
  time: 1000,
  duration: 60000,
  ratingKey,
});

const makePlayQueue = ({ ratingKey = 'movie-b', playQueueItemID = 700 } = {}) => ({
  playQueueID: 77,
  playQueueSelectedItemOffset: 0,
  size: 1,
  Metadata: [{ ...media, ratingKey, playQueueItemID }],
});

const makeStore = ({ chosenClientId = 'external-client' } = {}) => {
  const state = stateFactory();
  state.chosenClientId = chosenClientId;
  state.commandId = 10;
  state.clients['external-client'] = {
    clientIdentifier: 'external-client',
    product: 'Plex',
    chosenConnection: { uri: 'http://127.0.0.1:32400' },
    accessToken: 'redacted-client-token',
  };

  const events = [];
  const fetchStartIndex = fetchXmlCalls.length;
  const localGetters = {};
  const rootGetters = {
    'plexservers/GET_PLEX_SERVER': () => ({
      name: 'Server 1',
      accessToken: 'redacted-server-token',
      chosenConnection: {
        address: '127.0.0.1',
        port: 32400,
        protocol: 'http',
        uri: 'http://127.0.0.1:32400',
      },
    }),
    'slplayer/IS_PLAYER_INITIALIZED': true,
    'synclounge/IS_IN_ROOM': true,
    'plex/GET_PLEX_BASE_PARAMS': () => ({}),
    GET_CONFIG: { plex_client_time_delta_state_change_threshold: 500 },
  };

  for (const [name, getter] of Object.entries(gettersFactory)) {
    Object.defineProperty(localGetters, name, {
      enumerable: true,
      get: () => getter(state, localGetters, {}, rootGetters),
    });
  }

  const commit = (type, payload) => {
    const mutation = mutations[type];
    if (mutation) {
      mutation(state, payload);
      return;
    }
    events.push({ type: 'commit', mutation: type, payload });
  };

  const context = {
    state,
    getters: localGetters,
    rootGetters,
    commit,
    dispatch: async (type, payload) => {
      if (type === 'plexservers/CREATE_PLAY_QUEUE') return makePlayQueue();
      if (type === 'plexservers/FETCH_PLAY_QUEUE') return makePlayQueue({ ratingKey: payload.ratingKey || media.ratingKey });
      if (type === 'UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM') {
        commit('SET_ACTIVE_MEDIA_METADATA', localGetters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM);
        commit('SET_ACTIVE_SERVER_ID', localGetters.GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER);
        return null;
      }
      if (type === 'SEND_CHOSEN_CLIENT_REQUEST'
        || type === 'SEND_CLIENT_REQUEST'
        || type === 'SEND_CLIENT_REQUEST_WITH_URI'
        || type === 'RESERVE_COMMAND_ID') {
        return actions[type](context, payload);
      }
      if (type === 'synclounge/REQUEST_AUTO_HOST') {
        events.push({ type });
        return null;
      }
      if (type === 'synclounge/PROCESS_MEDIA_UPDATE') {
        events.push({ type, userInitiated: payload });
        return null;
      }
      if (type === 'synclounge/PROCESS_PLAYER_STATE_UPDATE'
        || type === 'DISPLAY_NOTIFICATION'
        || type === 'slplayer/CHANGE_PLAYER_SRC') {
        events.push({ type, payload });
        return null;
      }
      throw new Error(`Unexpected dispatch: ${type}`);
    },
  };

  return {
    ...context,
    events,
    get fetches() { return fetchXmlCalls.slice(fetchStartIndex); },
    get deferredRequests() { return fetchXmlCalls.slice(fetchStartIndex).map((call) => call.deferred); },
  };
};

const waitForOutboundRequest = async (store) => {
  for (let i = 0; i < 20 && store.deferredRequests.length === 0; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  if (store.deferredRequests.length === 0) throw new Error('Timed out waiting for outbound Plex request');
};

(async () => {
  const externalStore = makeStore();
  const externalPlay = actions.PLAY_MEDIA(externalStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: true,
  });
  await waitForOutboundRequest(externalStore);

  if (!externalStore.events.some((event) => event.type === 'synclounge/REQUEST_AUTO_HOST')) {
    throw new Error('Interface-initiated external PLAY_MEDIA should request Auto-Host immediately');
  }
  if (externalStore.events.some((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE')) {
    throw new Error('External PLAY_MEDIA should not infer Auto-Host from an immediate media update');
  }
  if (externalStore.fetches[0]?.args[1]?.commandID !== 10) {
    throw new Error('External PLAY_MEDIA should flow through the real request chain with the reserved commandID');
  }

  externalStore.deferredRequests[0].resolve({ MediaContainer: [{ Timeline: [] }] });
  await externalPlay;
  await actions.UPDATE_PLEX_CLIENT_TIMELINE(externalStore, makeTimeline());
  const pollUpdate = externalStore.events.filter((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE').pop();
  if (!pollUpdate || pollUpdate.userInitiated !== null) {
    throw new Error('Polling-origin media update should remain null after external PLAY_MEDIA');
  }

  const syncStore = makeStore();
  const syncPlay = actions.PLAY_MEDIA(syncStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: false,
  });
  await waitForOutboundRequest(syncStore);
  if (syncStore.events.some((event) => event.type === 'synclounge/REQUEST_AUTO_HOST')) {
    throw new Error('Sync-directed external PLAY_MEDIA must not request Auto-Host');
  }
  syncStore.deferredRequests[0].resolve({ MediaContainer: [{ Timeline: [] }] });
  await syncPlay;

  const slPlayerStore = makeStore({ chosenClientId: slPlayerClientId });
  await actions.PLAY_MEDIA(slPlayerStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: true,
  });
  if (!slPlayerStore.events.some((event) => event.type === 'synclounge/REQUEST_AUTO_HOST')) {
    throw new Error('Built-in player interface playback should also request Auto-Host');
  }
  const slPlayerUpdate = slPlayerStore.events.find((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE');
  if (!slPlayerUpdate || slPlayerUpdate.userInitiated !== true) {
    throw new Error('Built-in player path should keep its existing immediate userInitiated media update');
  }

  console.log('PASS Auto-Host interface playback production-flow checks');
})().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
