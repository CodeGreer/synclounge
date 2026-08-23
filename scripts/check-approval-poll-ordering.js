#!/usr/bin/env node

require('@babel/register')({
  extensions: ['.js'],
  ignore: [/node_modules/],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

const stateFactory = require('../src/store/modules/movienight/state').default;
const mutations = require('../src/store/modules/movienight/mutations').default;
const getters = require('../src/store/modules/movienight/getters').default;

const assertOrder = (results, expectedIds, message) => {
  const actualIds = results.map((candidate) => candidate.id);

  if (actualIds.join(',') !== expectedIds.join(',')) {
    throw new Error(
      `${message}: expected ${expectedIds.join(',')} but got ${actualIds.join(',')}`,
    );
  }
};

const resultsFor = (state) => getters.GET_ACTIVE_POLL_RESULTS(state);

(() => {
  const state = stateFactory();

  mutations.ADD_NOMINATION(state, { title: 'Movie A', type: 'movie' });
  mutations.ADD_NOMINATION(state, { title: 'Movie B', type: 'movie' });
  mutations.ADD_NOMINATION(state, { title: 'Movie C', type: 'movie' });

  mutations.START_APPROVAL_POLL_FROM_NOMINATIONS(state);

  const originalOrder = state.activePoll.candidates.map((candidate) => candidate.id);
  const [, secondId, thirdId] = originalOrder;

  mutations.SET_POLL_APPROVAL(state, {
    voterId: 'voter-1',
    candidateId: secondId,
    approved: true,
  });
  mutations.SET_POLL_APPROVAL(state, {
    voterId: 'voter-2',
    candidateId: secondId,
    approved: true,
  });
  mutations.SET_POLL_APPROVAL(state, {
    voterId: 'voter-3',
    candidateId: thirdId,
    approved: true,
  });

  assertOrder(
    resultsFor(state),
    originalOrder,
    'Open approval poll should preserve candidate order while votes arrive',
  );

  mutations.CLOSE_POLL(state);

  assertOrder(
    resultsFor(state),
    [secondId, thirdId, originalOrder[0]],
    'Closed approval poll should rank candidates by approval count',
  );

  mutations.START_POLL_RUNOFF(state, 2);

  const runoffOrder = state.activePoll.candidates.map((candidate) => candidate.id);

  assertOrder(
    resultsFor(state),
    [secondId, thirdId],
    'Runoff should select the top-ranked candidates from the closed round',
  );

  mutations.SET_POLL_APPROVAL(state, {
    voterId: 'runoff-voter',
    candidateId: thirdId,
    approved: true,
  });

  assertOrder(
    resultsFor(state),
    runoffOrder,
    'Open runoff should preserve candidate order while votes arrive',
  );

  mutations.CLOSE_POLL(state);

  assertOrder(
    resultsFor(state),
    [thirdId, secondId],
    'Closed runoff should rank candidates by approval count',
  );

  console.log('PASS approval poll ordering checks');
})();
