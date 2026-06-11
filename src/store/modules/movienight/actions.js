const getPlexNominationKey = ({ machineIdentifier, ratingKey }) => (
  machineIdentifier && ratingKey
    ? `plex:${machineIdentifier}:${ratingKey}`
    : null
);

export default {
  ADD_NOMINATION: ({ commit }, nomination) => {
    commit('ADD_NOMINATION', {
      source: 'manual',
      nominationKey: null,
      ...nomination,
    });
  },

  ADD_PLEX_NOMINATION: ({ commit }, content) => {
    commit('ADD_NOMINATION', {
      source: 'plex',
      nominationKey: getPlexNominationKey(content),
      title: content.title,
      year: content.year,
      type: content.type,
      ratingKey: content.ratingKey,
      key: content.key,
      machineIdentifier: content.machineIdentifier,
      thumb: content.thumb,
      art: content.art,
      duration: content.duration,
    });
  },

  REMOVE_NOMINATION: ({ commit }, id) => {
    commit('REMOVE_NOMINATION', id);
  },
};
