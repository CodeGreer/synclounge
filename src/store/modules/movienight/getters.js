export default {
  GET_NOMINATIONS: (state) => state.nominations,

  GET_PLAYLIST: (state) => state.playlist,

  GET_PLAYLIST_VISIBILITY: (state) => state.playlistVisibility,

  GET_PLAYLIST_AUTO_PLAY: (state) => state.playlistAutoPlay,

  GET_ACTIVE_PLAYLIST_ITEM: (state) => state.activePlaylistItem,

  GET_ACTIVE_POLL: (state) => state.activePoll,

  GET_CONTROLLER_STATUS: (state) => state.controllerStatus,

  IS_CONTROLLER_ACTIVE: (state) => Boolean(state.controllerStatus && state.controllerStatus.active),

  GET_ACTIVE_POLL_RESULTS: (state) => {
    if (!state.activePoll) {
      return [];
    }

    const votesBySocketId = state.activePoll.votesBySocketId || {};
    const approvals = Object.values(votesBySocketId).flat();

    return state.activePoll.candidates
      .map((candidate) => ({
        ...candidate,
        approvalCount: approvals
          .filter((candidateId) => String(candidateId) === String(candidate.id)).length,
      }))
      .sort((a, b) => b.approvalCount - a.approvalCount);
  },

  IS_NOMINATED: (state) => (nominationKey) => state.nominations
    .some((nomination) => nomination.nominationKey === nominationKey),

  IS_IN_PLAYLIST: (state) => (playlistKey) => state.playlist
    .some((item) => item.playlistKey === playlistKey),
};
