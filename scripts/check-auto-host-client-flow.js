#!/usr/bin/env node
const path = require('path');
const Module = require('module');

const fetchXmlCalls = [];

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

const pendingPlayMediaOriginMaxAgeMs = 30000;
const media = {
  title: 'Movie B',
  type: 'movie',
  ratingKey: 'movie-b',
  key: '/library/metadata/movie-b',
  machineIdentifier: 'server-1',
};

const makeDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const makeTimeline = ({ commandID = 10, playQueueItemID = 700, ratingKey = 'movie-b' } = {}) => ({
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
  Metadata: [{
    ...media,
    ratingKey,
    playQueueItemID,
  }],
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
  const requests = [];
  const fetchStartIndex = fetchXmlCalls.length;
  const dispatched = [];

  const localGetters = {};
  for (const [name, getter] of Object.entries(gettersFactory)) {
    Object.defineProperty(localGetters, name, {
      enumerable: true,
      get: () => getter(state, localGetters, {}, rootGetters),
    });
  }

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

  const commit = (type, payload) => {
    const mutation = mutations[type];
    if (!mutation) {
      events.push({ type: 'commit', mutation: type, payload });
      return;
    }
    mutation(state, payload);
  };

  const context = {
    state,
    getters: localGetters,
    rootGetters,
    commit,
    dispatch: async (type, payload) => {
      dispatched.push({ type, payload });

      if (type === 'plexservers/CREATE_PLAY_QUEUE') {
        return makePlayQueue();
      }

      if (type === 'plexservers/FETCH_PLAY_QUEUE') {
        return makePlayQueue({ ratingKey: payload.ratingKey || media.ratingKey, playQueueItemID: payload.playQueueItemID || 700 });
      }

      if (type === 'UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM') {
        commit('SET_ACTIVE_MEDIA_METADATA', localGetters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM);
        commit('SET_ACTIVE_SERVER_ID', localGetters.GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER);
        return null;
      }

      if (type === 'SEND_CHOSEN_CLIENT_REQUEST'
        || type === 'SEND_CLIENT_REQUEST'
        || type === 'SEND_CLIENT_REQUEST_WITH_URI'
        || type === 'RESERVE_COMMAND_ID'
        || type === 'CONSUME_PENDING_PLAY_MEDIA_ORIGIN'
        || type === 'CLEAR_PENDING_PLAY_MEDIA_ORIGIN_IF_MATCHES'
        || type === 'MARK_PENDING_PLAY_MEDIA_ORIGIN_COMPLETE_IF_MATCHES') {
        return actions[type](context, payload);
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
    requests,
    get fetches() { return fetchXmlCalls.slice(fetchStartIndex); },
    get deferredRequests() { return fetchXmlCalls.slice(fetchStartIndex).map((call) => call.deferred); },
    dispatched,
  };
};

const waitForOutboundRequest = async (store, count = 1) => {
  for (let i = 0; i < 20 && store.deferredRequests.length < count; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  if (store.deferredRequests.length < count) {
    throw new Error('Timed out waiting for outbound Plex request');
  }
};

const processMatchingTimeline = async (store, timeline = makeTimeline()) => {
  await actions.UPDATE_PLEX_CLIENT_TIMELINE(store, timeline);
  return store.events.filter((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE').pop();
};

(async () => {
  const raceStore = makeStore();
  const playPromise = actions.PLAY_MEDIA(raceStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: false,
  });
  await waitForOutboundRequest(raceStore);

  if (raceStore.state.pendingPlayMediaOrigin?.userInitiated !== false) {
    throw new Error('PLAY_MEDIA must install pending origin before outbound Plex request resolves');
  }
  const sentCommandID = raceStore.fetches[0]?.args[1]?.commandID;
  if (sentCommandID !== raceStore.state.pendingPlayMediaOrigin.commandId) {
    throw new Error('Pending origin command id must exactly match commandID sent by SEND_CLIENT_REQUEST_WITH_URI');
  }

  const raceUpdate = await processMatchingTimeline(raceStore);
  if (!raceUpdate || raceUpdate.userInitiated !== false) {
    throw new Error('Matching poll during unresolved PLAY_MEDIA must emit explicit false, not null');
  }
  raceStore.deferredRequests[0].resolve(null);
  await playPromise;


  const intermediateStore = makeStore();
  intermediateStore.state.plexClientTimeline = makeTimeline({ commandID: 8, playQueueItemID: 600, ratingKey: 'movie-a' });
  intermediateStore.state.activePlayQueue = makePlayQueue({ ratingKey: 'movie-a', playQueueItemID: 600 });
  const intermediatePlay = actions.PLAY_MEDIA(intermediateStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: false,
  });
  await waitForOutboundRequest(intermediateStore);
  const mediaEventCountBeforeIntermediate = intermediateStore.events.filter((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE').length;
  const intermediateUpdate = await processMatchingTimeline(
    intermediateStore,
    makeTimeline({ commandID: 11, playQueueItemID: 600, ratingKey: 'movie-a' }),
  );
  if (intermediateUpdate
    || intermediateStore.events.filter((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE').length
      !== mediaEventCountBeforeIntermediate) {
    throw new Error('Intermediate pre-command media timeline should not emit an Auto-Host-eligible update');
  }
  if (!intermediateStore.state.pendingPlayMediaOrigin) {
    throw new Error('Intermediate pre-command media timeline must preserve pending origin');
  }
  const intermediateTargetUpdate = await processMatchingTimeline(intermediateStore, makeTimeline({ commandID: 12 }));
  if (!intermediateTargetUpdate || intermediateTargetUpdate.userInitiated !== false) {
    throw new Error('Target media after intermediate timeline should consume pending origin as explicit false');
  }
  intermediateStore.deferredRequests[0].resolve(null);
  await intermediatePlay;

  const failureStore = makeStore();
  failureStore.state.lastPlayMediaCommandId = 5;
  const failurePromise = actions.PLAY_MEDIA(failureStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: false,
  }).catch((error) => error);
  await waitForOutboundRequest(failureStore);
  failureStore.deferredRequests[0].reject(new Error('simulated play failure'));
  const failureResult = await failurePromise;
  if (!(failureResult instanceof Error) || failureStore.state.pendingPlayMediaOrigin !== null) {
    throw new Error('Failed play command should clear its own pending marker and reject');
  }
  if (failureStore.state.lastPlayMediaCommandId !== 5) {
    throw new Error('Failed play command should restore the previous valid lastPlayMediaCommandId boundary');
  }
  await actions.POLL_PLEX_CLIENT({
    ...failureStore,
    dispatch: async (type, payload) => {
      if (type === 'FETCH_CHOSEN_CLIENT_TIMELINE') return makeTimeline({ commandID: 4 });
      if (type === 'UPDATE_PLEX_CLIENT_TIMELINE') return actions.UPDATE_PLEX_CLIENT_TIMELINE(failureStore, payload);
      return failureStore.dispatch(type, payload);
    },
  });
  if (failureStore.events.some((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE')) {
    throw new Error('Stale older timeline should remain rejected after later play command failure');
  }

  const supersedeStore = makeStore();
  const firstPlay = actions.PLAY_MEDIA(supersedeStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: false,
  }).catch((error) => error);
  await waitForOutboundRequest(supersedeStore);
  const firstCommandId = supersedeStore.state.pendingPlayMediaOrigin.commandId;
  const secondPlay = actions.PLAY_MEDIA(supersedeStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: true,
  });
  await waitForOutboundRequest(supersedeStore, 2);
  const secondCommandId = supersedeStore.state.pendingPlayMediaOrigin.commandId;
  supersedeStore.deferredRequests[0].reject(new Error('first failed after second started'));
  await firstPlay;
  if (supersedeStore.state.pendingPlayMediaOrigin?.commandId !== secondCommandId
    || supersedeStore.state.pendingPlayMediaOrigin.commandId === firstCommandId) {
    throw new Error('Older command failure must not clear newer pending marker');
  }
  supersedeStore.deferredRequests[1].resolve(null);
  await secondPlay;

  const olderStore = makeStore();
  const olderPlay = actions.PLAY_MEDIA(olderStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: false,
  });
  await waitForOutboundRequest(olderStore);
  await actions.POLL_PLEX_CLIENT({
    ...olderStore,
    dispatch: async (type, payload) => {
      if (type === 'FETCH_CHOSEN_CLIENT_TIMELINE') return makeTimeline({ commandID: 9 });
      if (type === 'UPDATE_PLEX_CLIENT_TIMELINE') return actions.UPDATE_PLEX_CLIENT_TIMELINE(olderStore, payload);
      return olderStore.dispatch(type, payload);
    },
  });
  if (!olderStore.state.pendingPlayMediaOrigin) {
    throw new Error('Older timeline must not consume or erase pending origin');
  }
  olderStore.deferredRequests[0].resolve(null);
  await olderPlay;

  const unrelatedStore = makeStore();
  const unrelatedPlay = actions.PLAY_MEDIA(unrelatedStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: false,
  });
  await waitForOutboundRequest(unrelatedStore);
  const unrelatedUpdate = await processMatchingTimeline(
    unrelatedStore,
    makeTimeline({ commandID: 11, playQueueItemID: 701, ratingKey: 'movie-c' }),
  );
  if (!unrelatedUpdate || unrelatedUpdate.userInitiated !== null) {
    throw new Error('Unrelated newer external media change should remain null and Auto-Host eligible');
  }
  if (unrelatedStore.state.pendingPlayMediaOrigin !== null) {
    throw new Error('Unrelated newer media change should clear pending origin as superseded');
  }
  unrelatedStore.deferredRequests[0].resolve(null);
  await unrelatedPlay;

  const expiredStore = makeStore();
  const expiredPlay = actions.PLAY_MEDIA(expiredStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: false,
  });
  await waitForOutboundRequest(expiredStore);
  expiredStore.state.pendingPlayMediaOrigin.createdAt -= pendingPlayMediaOriginMaxAgeMs + 1;
  const expiredUpdate = await processMatchingTimeline(expiredStore);
  if (!expiredUpdate || expiredUpdate.userInitiated !== null) {
    throw new Error('Expired pending origin should not classify later media changes as sync-directed');
  }
  expiredStore.deferredRequests[0].resolve(null);
  await expiredPlay;

  const slPlayerStore = makeStore({ chosenClientId: slPlayerClientId });
  await actions.PLAY_MEDIA(slPlayerStore, {
    mediaIndex: 0,
    offset: 0,
    metadata: media,
    machineIdentifier: media.machineIdentifier,
    userInitiated: true,
  });
  const slPlayerUpdate = slPlayerStore.events.find((event) => event.type === 'synclounge/PROCESS_MEDIA_UPDATE');
  if (!slPlayerUpdate || slPlayerUpdate.userInitiated !== true || slPlayerStore.state.pendingPlayMediaOrigin !== null) {
    throw new Error('Built-in Sync-A-Rama player path should preserve immediate PROCESS_MEDIA_UPDATE behavior');
  }

  console.log('PASS Auto-Host external Plex client production-flow checks');
})().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
