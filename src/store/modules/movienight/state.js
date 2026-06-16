const state = () => ({
  nextNominationId: 1,
  nextPlaylistItemId: 1,
  nominations: [],
  playlist: [],
  playlistVisibility: 'next',
  playlistAutoPlay: false,
  activePlaylistItem: null,
});

export default state;
