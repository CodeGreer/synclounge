import { emit, isConnected } from '@/socket';

const isSocketBacked = (rootGetters) => (
  rootGetters['synclounge/IS_IN_ROOM'] && isConnected()
);

const emitOrCommit = ({
  commit, rootGetters, eventName, mutation, data,
}) => {
  if (isSocketBacked(rootGetters)) {
    emit({ eventName, data });
    return;
  }

  commit(mutation, data);
};

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
  ADD_NOMINATION: ({ commit, rootGetters }, nomination) => {
    const data = {
      source: 'manual',
      nominationKey: null,
      ...nomination,
    };

    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightAddNomination',
      mutation: 'ADD_NOMINATION',
      data,
    });
  },

  ADD_PLEX_NOMINATION: ({ commit, rootGetters }, content) => {
    const data = {
      source: 'plex',
      nominationKey: getPlexNominationKey(content),
      ...getPlexTitlePayload(content),
    };

    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightAddNomination',
      mutation: 'ADD_NOMINATION',
      data,
    });
  },

  REMOVE_NOMINATION: ({ commit, rootGetters }, id) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightRemoveNomination',
      mutation: 'REMOVE_NOMINATION',
      data: id,
    });
  },

  ADD_PLEX_PLAYLIST_ITEM: ({ commit, rootGetters }, content) => {
    const data = {
      source: 'plex',
      playlistKey: getPlexPlaylistKey(content),
      ...getPlexTitlePayload(content),
    };

    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightAddPlaylistItem',
      mutation: 'ADD_PLAYLIST_ITEM',
      data,
    });
  },

  REMOVE_PLAYLIST_ITEM: ({ commit, rootGetters }, id) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightRemovePlaylistItem',
      mutation: 'REMOVE_PLAYLIST_ITEM',
      data: id,
    });
  },

  MOVE_PLAYLIST_ITEM_UP: ({ commit, rootGetters }, id) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightMovePlaylistItemUp',
      mutation: 'MOVE_PLAYLIST_ITEM_UP',
      data: id,
    });
  },

  MOVE_PLAYLIST_ITEM_DOWN: ({ commit, rootGetters }, id) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightMovePlaylistItemDown',
      mutation: 'MOVE_PLAYLIST_ITEM_DOWN',
      data: id,
    });
  },

  CLEAR_PLAYLIST: ({ commit, rootGetters }) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightClearPlaylist',
      mutation: 'CLEAR_PLAYLIST',
      data: null,
    });
  },

  SET_PLAYLIST_VISIBILITY: ({ commit, rootGetters }, visibility) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightSetPlaylistVisibility',
      mutation: 'SET_PLAYLIST_VISIBILITY',
      data: visibility,
    });
  },
};
