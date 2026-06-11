export default {
  ADD_NOMINATION: ({ commit }, nomination) => {
    commit('ADD_NOMINATION', nomination);
  },

  REMOVE_NOMINATION: ({ commit }, id) => {
    commit('REMOVE_NOMINATION', id);
  },
};
