export default {
  SET_MOVIENIGHT_STATE: (state, movieNight = {}) => {
    state.nextNominationId = movieNight.nextNominationId || 1;
    state.nextPlaylistItemId = movieNight.nextPlaylistItemId || 1;
    state.nominations = movieNight.nominations || [];
    state.playlist = movieNight.playlist || [];
    state.playlistVisibility = movieNight.playlistVisibility || 'next';
    state.playlistAutoPlay = Boolean(movieNight.playlistAutoPlay);
  },

  ADD_NOMINATION: (state, nomination) => {
    if (
      nomination.nominationKey
      && state.nominations.some((existing) => existing.nominationKey === nomination.nominationKey)
    ) {
      return;
    }

    state.nominations.push({
      id: state.nextNominationId,
      ...nomination,
    });

    state.nextNominationId += 1;
  },

  REMOVE_NOMINATION: (state, id) => {
    state.nominations = state.nominations.filter((nomination) => nomination.id !== id);
  },

  ADD_PLAYLIST_ITEM: (state, item) => {
    if (
      item.playlistKey
      && state.playlist.some((existing) => existing.playlistKey === item.playlistKey)
    ) {
      return;
    }

    state.playlist.push({
      id: state.nextPlaylistItemId,
      ...item,
    });

    state.nextPlaylistItemId += 1;
  },

  REMOVE_PLAYLIST_ITEM: (state, id) => {
    state.playlist = state.playlist.filter((item) => item.id !== id);
  },

  MOVE_PLAYLIST_ITEM_UP: (state, id) => {
    const index = state.playlist.findIndex((item) => item.id === id);

    if (index <= 0) {
      return;
    }

    const playlist = state.playlist.slice();
    const [item] = playlist.splice(index, 1);
    playlist.splice(index - 1, 0, item);
    state.playlist = playlist;
  },

  MOVE_PLAYLIST_ITEM_DOWN: (state, id) => {
    const index = state.playlist.findIndex((item) => item.id === id);

    if (index < 0 || index >= state.playlist.length - 1) {
      return;
    }

    const playlist = state.playlist.slice();
    const [item] = playlist.splice(index, 1);
    playlist.splice(index + 1, 0, item);
    state.playlist = playlist;
  },

  CLEAR_PLAYLIST: (state) => {
    state.playlist = [];
  },

  SET_PLAYLIST_VISIBILITY: (state, visibility) => {
    if (!['private', 'next', 'public'].includes(visibility)) {
      return;
    }

    state.playlistVisibility = visibility;
  },

  SET_PLAYLIST_AUTO_PLAY: (state, playlistAutoPlay) => {
    state.playlistAutoPlay = Boolean(playlistAutoPlay);
  },

  SET_ACTIVE_PLAYLIST_ITEM: (state, item) => {
    state.activePlaylistItem = item
      ? {
        id: item.id,
        playlistKey: item.playlistKey,
        machineIdentifier: item.machineIdentifier,
        ratingKey: item.ratingKey,
      }
      : null;
  },
};
