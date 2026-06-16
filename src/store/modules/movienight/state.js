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
  controllerStatus: {
    active: false,
    reason: 'waiting_for_host',
    message: 'Waiting for your main host/player window to connect.',
  },
});

export default state;
