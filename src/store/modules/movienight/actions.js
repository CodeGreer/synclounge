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

  SET_PLAYLIST_AUTO_PLAY: ({ commit, rootGetters }, playlistAutoPlay) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightSetPlaylistAutoPlay',
      mutation: 'SET_PLAYLIST_AUTO_PLAY',
      data: playlistAutoPlay,
    });
  },

  SET_ACTIVE_PLAYLIST_ITEM: ({ commit, rootGetters }, item) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightSetActivePlaylistItem',
      mutation: 'SET_ACTIVE_PLAYLIST_ITEM',
      data: item,
    });
  },

  START_PLAYLIST: async ({ state, dispatch }) => {
    const firstItem = state.playlist[0];

    if (!firstItem) {
      return false;
    }

    await dispatch('SET_PLAYLIST_AUTO_PLAY', true);
    await dispatch('SET_ACTIVE_PLAYLIST_ITEM', firstItem);

    const metadata = await dispatch('plexservers/FETCH_PLEX_METADATA', {
      ratingKey: firstItem.ratingKey,
      machineIdentifier: firstItem.machineIdentifier,
    }, { root: true });

    await dispatch('plexclients/PLAY_MEDIA', {
      metadata,
      mediaIndex: 0,
      machineIdentifier: metadata.machineIdentifier,
      offset: 0,
      userInitiated: true,
    }, { root: true });

    return true;
  },

  STOP_PLAYLIST: async ({ dispatch }) => {
    await dispatch('SET_PLAYLIST_AUTO_PLAY', false);
    await dispatch('SET_ACTIVE_PLAYLIST_ITEM', null);
    await dispatch('plexclients/PRESS_STOP', null, { root: true });

    return true;
  },

  START_APPROVAL_POLL_FROM_NOMINATIONS: ({ commit, rootGetters }) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightStartApprovalPollFromNominations',
      mutation: 'START_APPROVAL_POLL_FROM_NOMINATIONS',
      data: null,
    });
  },

  SET_POLL_APPROVAL: ({ commit, rootGetters }, data) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightSetPollApproval',
      mutation: 'SET_POLL_APPROVAL',
      data: {
        voterId: 'local',
        ...data,
      },
    });
  },

  CLOSE_POLL: ({ commit, rootGetters }) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightClosePoll',
      mutation: 'CLOSE_POLL',
      data: null,
    });
  },

  START_POLL_RUNOFF: ({ commit, rootGetters }, limit) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightStartPollRunoff',
      mutation: 'START_POLL_RUNOFF',
      data: limit,
    });
  },

  CLEAR_POLL: ({ commit, rootGetters }) => {
    emitOrCommit({
      commit,
      rootGetters,
      eventName: 'movieNightClearPoll',
      mutation: 'CLEAR_POLL',
      data: null,
    });
  },

  HANDLE_PLAYLIST_ITEM_ENDED: async ({
    state, getters, rootGetters, dispatch,
  }, metadata) => {
    const activeItem = getters.GET_ACTIVE_PLAYLIST_ITEM;

    if (!metadata || !activeItem) {
      return false;
    }

    const shouldControlPlaylist = !rootGetters['synclounge/IS_IN_ROOM']
      || rootGetters['synclounge/AM_I_HOST'];

    if (!shouldControlPlaylist) {
      return false;
    }

    const endedActiveItem = activeItem.machineIdentifier === metadata.machineIdentifier
      && String(activeItem.ratingKey) === String(metadata.ratingKey);

    if (!endedActiveItem) {
      return false;
    }

    if (!getters.GET_PLAYLIST_AUTO_PLAY) {
      await dispatch('SET_ACTIVE_PLAYLIST_ITEM', null);
      return false;
    }

    const activeIndex = state.playlist.findIndex((item) => item.id === activeItem.id);
    const nextItem = activeIndex >= 0
      ? state.playlist[activeIndex + 1]
      : state.playlist[0];

    if (!nextItem) {
      await dispatch('SET_PLAYLIST_AUTO_PLAY', false);
      await dispatch('SET_ACTIVE_PLAYLIST_ITEM', null);
      return false;
    }

    await dispatch('SET_ACTIVE_PLAYLIST_ITEM', nextItem);

    const nextMetadata = await dispatch('plexservers/FETCH_PLEX_METADATA', {
      ratingKey: nextItem.ratingKey,
      machineIdentifier: nextItem.machineIdentifier,
    }, { root: true });

    await dispatch('plexclients/PLAY_MEDIA', {
      metadata: nextMetadata,
      mediaIndex: 0,
      machineIdentifier: nextMetadata.machineIdentifier,
      offset: 0,
      userInitiated: false,
    }, { root: true });

    return true;
  },
};
