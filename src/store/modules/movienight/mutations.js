export default {
  ADD_NOMINATION: (state, nomination) => {
    state.nominations.push({
      id: state.nextNominationId,
      ...nomination,
    });

    state.nextNominationId += 1;
  },

  REMOVE_NOMINATION: (state, id) => {
    state.nominations = state.nominations.filter((nomination) => nomination.id !== id);
  },
};
