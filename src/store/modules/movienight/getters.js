export default {
  GET_NOMINATIONS: (state) => state.nominations,

  GET_PLAYLIST: (state) => state.playlist,

  GET_PLAYLIST_VISIBILITY: (state) => state.playlistVisibility,

  GET_PLAYLIST_AUTO_PLAY: (state) => state.playlistAutoPlay,

  IS_NOMINATED: (state) => (nominationKey) => state.nominations
    .some((nomination) => nomination.nominationKey === nominationKey),

  IS_IN_PLAYLIST: (state) => (playlistKey) => state.playlist
    .some((item) => item.playlistKey === playlistKey),
};
