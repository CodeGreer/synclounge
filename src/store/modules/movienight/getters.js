export default {
  GET_NOMINATIONS: (state) => state.nominations,

  GET_PLAYLIST: (state) => state.playlist,

  IS_NOMINATED: (state) => (nominationKey) => state.nominations
    .some((nomination) => nomination.nominationKey === nominationKey),

  IS_IN_PLAYLIST: (state) => (playlistKey) => state.playlist
    .some((item) => item.playlistKey === playlistKey),
};
