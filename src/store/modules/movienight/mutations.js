const createApprovalPollFromNominations = (state) => ({
  id: state.nextPollId,
  source: 'nominations',
  mode: 'approval',
  status: 'open',
  candidates: state.nominations.map((nomination) => ({ ...nomination })),
  votesBySocketId: {},
  createdAt: new Date().toISOString(),
  closedAt: null,
});

const setPollApproval = ({
  poll, voterId, candidateId, approved,
}) => {
  if (!poll || poll.status !== 'open') {
    return poll;
  }

  const candidateExists = poll.candidates
    .some((candidate) => String(candidate.id) === String(candidateId));

  if (!candidateExists) {
    return poll;
  }

  const votesBySocketId = {
    ...(poll.votesBySocketId || {}),
  };

  const currentApprovals = new Set(votesBySocketId[voterId] || []);

  if (approved) {
    currentApprovals.add(candidateId);
  } else {
    currentApprovals.delete(candidateId);
  }

  if (currentApprovals.size > 0) {
    votesBySocketId[voterId] = Array.from(currentApprovals);
  } else {
    delete votesBySocketId[voterId];
  }

  return {
    ...poll,
    votesBySocketId,
  };
};

export default {
  SET_MOVIENIGHT_STATE: (state, movieNight = {}) => {
    state.nextNominationId = movieNight.nextNominationId || 1;
    state.nextPlaylistItemId = movieNight.nextPlaylistItemId || 1;
    state.nextPollId = movieNight.nextPollId || 1;
    state.nominations = movieNight.nominations || [];
    state.playlist = movieNight.playlist || [];
    state.playlistVisibility = movieNight.playlistVisibility || 'next';
    state.playlistAutoPlay = Boolean(movieNight.playlistAutoPlay);

    if (Object.prototype.hasOwnProperty.call(movieNight, 'activePlaylistItem')) {
      state.activePlaylistItem = movieNight.activePlaylistItem;
    }

    if (Object.prototype.hasOwnProperty.call(movieNight, 'activePoll')) {
      state.activePoll = movieNight.activePoll;
    }
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

    if (state.activePlaylistItem && state.activePlaylistItem.id === id) {
      state.activePlaylistItem = null;
    }
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
    state.activePlaylistItem = null;
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

  START_APPROVAL_POLL_FROM_NOMINATIONS: (state) => {
    if (state.nominations.length === 0) {
      return;
    }

    state.activePoll = createApprovalPollFromNominations(state);
    state.nextPollId += 1;
  },

  SET_POLL_APPROVAL: (state, {
    voterId = 'local', candidateId, approved,
  }) => {
    state.activePoll = setPollApproval({
      poll: state.activePoll,
      voterId,
      candidateId,
      approved,
    });
  },

  CLOSE_POLL: (state) => {
    if (!state.activePoll || state.activePoll.status !== 'open') {
      return;
    }

    state.activePoll = {
      ...state.activePoll,
      status: 'closed',
      closedAt: new Date().toISOString(),
    };
  },

  CLEAR_POLL: (state) => {
    state.activePoll = null;
  },
};
