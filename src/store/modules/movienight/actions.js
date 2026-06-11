const getPlexNominationKey = ({ machineIdentifier, ratingKey }) => (
  machineIdentifier && ratingKey
    ? `plex:${machineIdentifier}:${ratingKey}`
    : null
);

const getPlexPlaylistKey = ({ machineIdentifier, ratingKey }) => (
  machineIdentifier && ratingKey
    ? `plex:${machineIdentifier}:${ratingKey}`
    : null
);

const getPlexTitlePayload = (content) => ({
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
      ...getPlexTitlePayload(content),
    });
  },

  REMOVE_NOMINATION: ({ commit }, id) => {
    commit('REMOVE_NOMINATION', id);
  },

  ADD_PLEX_PLAYLIST_ITEM: ({ commit }, content) => {
    commit('ADD_PLAYLIST_ITEM', {
      source: 'plex',
      playlistKey: getPlexPlaylistKey(content),
      ...getPlexTitlePayload(content),
    });
  },

  REMOVE_PLAYLIST_ITEM: ({ commit }, id) => {
    commit('REMOVE_PLAYLIST_ITEM', id);
  },

  MOVE_PLAYLIST_ITEM_UP: ({ commit }, id) => {
    commit('MOVE_PLAYLIST_ITEM_UP', id);
  },

  MOVE_PLAYLIST_ITEM_DOWN: ({ commit }, id) => {
    commit('MOVE_PLAYLIST_ITEM_DOWN', id);
  },

  CLEAR_PLAYLIST: ({ commit }) => {
    commit('CLEAR_PLAYLIST');
  },

  SET_PLAYLIST_VISIBILITY: ({ commit }, visibility) => {
    commit('SET_PLAYLIST_VISIBILITY', visibility);
  },
};
