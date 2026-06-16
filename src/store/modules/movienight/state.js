const state = () => ({
  nextNominationId: 1,
  nextPlaylistItemId: 1,
  nextPollId: 1,
  nominations: [],
  playlist: [],
  playlistVisibility: 'next',
  playlistAutoPlay: false,
  activePlaylistItem: null,
  activePoll: null,
});

export default state;
