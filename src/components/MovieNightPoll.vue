<template>
  <div>
    <v-divider class="my-3" />

    <div class="d-flex align-center mb-2">
      <v-icon
        small
        class="mr-2"
      >
        how_to_vote
      </v-icon>

      <div class="text-subtitle-2">
        Approval Vote
        <span v-if="activePoll && activePoll.round > 1">
          Round {{ activePoll.round }}
        </span>
      </div>

      <v-spacer />

      <v-chip
        v-if="activePoll"
        x-small
        :color="activePoll.status === 'open' ? 'success' : 'grey'"
      >
        {{ activePoll.status === 'open' ? 'Open' : 'Closed' }}
      </v-chip>
    </div>

    <div v-if="!activePoll">
      <v-btn
        v-if="canManagePoll"
        small
        outlined
        block
        class="mb-2"
        :disabled="!nominations.length"
        @click="startApprovalPoll"
      >
        <v-icon
          small
          left
        >
          how_to_vote
        </v-icon>
        Start Vote from Nominations
      </v-btn>

      <div class="text--secondary">
        {{ inactivePollMessage }}
      </div>
    </div>

    <div v-else>
      <v-alert
        dense
        text
        type="info"
        class="mb-2"
      >
        Approve anything you would be happy watching. The title with the most approvals wins.
      </v-alert>

      <div
        v-if="canManagePoll"
        class="d-flex flex-wrap mb-2"
      >
        <v-btn
          v-if="activePoll.status === 'open'"
          small
          outlined
          color="primary"
          class="mr-2 mb-2"
          @click="closePoll"
        >
          <v-icon
            small
            left
          >
            check_circle
          </v-icon>
          Close Vote
        </v-btn>

        <v-btn
          small
          outlined
          class="mb-2"
          @click="clearPoll"
        >
          <v-icon
            small
            left
          >
            clear
          </v-icon>
          Clear Vote
        </v-btn>
      </div>

      <v-alert
        v-if="closedResultsMessage"
        dense
        text
        :type="hasAnyApproval ? 'success' : 'warning'"
        class="mb-2"
      >
        {{ closedResultsMessage }}
      </v-alert>

      <v-btn
        v-if="canAddTopResultToPlaylist"
        small
        outlined
        block
        class="mb-2"
        :disabled="isCandidateInPlaylist(topResult)"
        @click="addTopResultToPlaylist"
      >
        <v-icon
          small
          left
        >
          playlist_add
        </v-icon>
        {{ addTopResultLabel }}
      </v-btn>

      <div
        v-if="canStartRunoff"
        class="mb-2"
      >
        <div class="text-caption text--secondary mb-1">
          Runoff starts a new round using the top results and clears previous votes.
        </div>

        <div class="d-flex flex-wrap">
          <v-btn
            v-for="limit in runoffLimits"
            :key="limit"
            small
            outlined
            class="mr-2 mb-2"
            @click="startRunoff(limit)"
          >
            Runoff Top {{ limit }}
          </v-btn>
        </div>
      </div>

      <v-list
        dense
        color="transparent"
      >
        <v-list-item
          v-for="candidate in pollResults"
          :key="candidate.id"
        >
          <v-list-item-icon>
            <v-checkbox
              v-if="canVotePoll"
              dense
              hide-details
              class="ma-0 pa-0"
              :input-value="isCandidateApproved(candidate)"
              :disabled="activePoll.status !== 'open'"
              @change="setCandidateApproval(candidate, $event)"
            />

            <v-icon v-else>
              {{ getCandidateIcon(candidate) }}
            </v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title class="d-flex align-center">
              <span class="text-truncate">
                {{ candidate.title }}
              </span>

              <v-chip
                v-if="getResultChipLabel(candidate)"
                x-small
                class="ml-2 flex-shrink-0"
                :color="getResultChipColor(candidate)"
              >
                {{ getResultChipLabel(candidate) }}
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ getCandidateTypeLabel(candidate) }}
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-chip x-small>
              {{ candidate.approvalCount }}
            </v-chip>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import { postMovieNightControllerMessage } from '@/utils/movienightcontrollerchannel';

export default {
  name: 'MovieNightPoll',

  computed: {
    ...mapGetters('synclounge', [
      'AM_I_HOST',
      'GET_SOCKET_ID',
      'IS_IN_ROOM',
    ]),

    ...mapGetters('movienight', [
      'GET_ACTIVE_POLL',
      'GET_ACTIVE_POLL_RESULTS',
      'GET_NOMINATIONS',
      'IS_IN_PLAYLIST',
    ]),

    activePoll() {
      return this.GET_ACTIVE_POLL;
    },

    nominations() {
      return this.GET_NOMINATIONS;
    },

    pollResults() {
      return this.GET_ACTIVE_POLL_RESULTS;
    },

    topResult() {
      return this.pollResults[0] || null;
    },

    maxApprovalCount() {
      return this.topResult
        ? this.topResult.approvalCount
        : 0;
    },

    hasAnyApproval() {
      return this.maxApprovalCount > 0;
    },

    leadingResults() {
      if (!this.hasAnyApproval) {
        return [];
      }

      return this.pollResults
        .filter((candidate) => candidate.approvalCount === this.maxApprovalCount);
    },

    isTieForLead() {
      return this.leadingResults.length > 1;
    },

    closedResultsMessage() {
      if (!this.activePoll || this.activePoll.status !== 'closed') {
        return '';
      }

      if (!this.hasAnyApproval) {
        return 'No approvals were cast. Clear the vote or start again.';
      }

      if (this.isTieForLead) {
        return [
          `${this.leadingResults.length} titles are tied`,
          `with ${this.maxApprovalCount} approvals.`,
        ].join(' ');
      }

      return `${this.topResult.title} wins with ${this.maxApprovalCount} approvals.`;
    },

    isControllerWindow() {
      return this.$route.query.controller === '1';
    },

    canManagePoll() {
      return this.AM_I_HOST || this.isControllerWindow;
    },

    canVotePoll() {
      return this.IS_IN_ROOM
        && !this.isControllerWindow
        && this.activePoll
        && this.activePoll.status === 'open';
    },

    currentApprovals() {
      if (!this.activePoll || !this.GET_SOCKET_ID) {
        return [];
      }

      return this.activePoll.votesBySocketId?.[this.GET_SOCKET_ID] || [];
    },

    inactivePollMessage() {
      if (!this.nominations.length) {
        return 'Add nominations before starting a vote.';
      }

      return this.canManagePoll
        ? 'Start a vote when the nomination list is ready.'
        : 'No vote is currently active.';
    },

    canAddTopResultToPlaylist() {
      return this.canManagePoll
        && this.activePoll
        && this.activePoll.status === 'closed'
        && this.hasAnyApproval
        && this.topResult
        && this.isPlayableCandidate(this.topResult);
    },

    canStartRunoff() {
      return this.canManagePoll
        && this.activePoll
        && this.activePoll.status === 'closed'
        && this.hasAnyApproval
        && this.pollResults.length >= 2;
    },

    runoffLimits() {
      return [2, 3, 5].filter((limit) => this.pollResults.length >= limit);
    },

    addTopResultLabel() {
      if (!this.topResult) {
        return 'Add winner to playlist';
      }

      if (this.isCandidateInPlaylist(this.topResult)) {
        return this.isTieForLead
          ? 'Top tied result already in playlist'
          : 'Winner already in playlist';
      }

      return this.isTieForLead
        ? 'Add top tied result to playlist'
        : 'Add winner to playlist';
    },
  },

  methods: {
    ...mapActions('movienight', [
      'START_APPROVAL_POLL_FROM_NOMINATIONS',
      'SET_POLL_APPROVAL',
      'CLOSE_POLL',
      'START_POLL_RUNOFF',
      'CLEAR_POLL',
      'ADD_PLEX_PLAYLIST_ITEM',
    ]),

    startApprovalPoll() {
      if (this.isControllerWindow) {
        postMovieNightControllerMessage({
          room: this.$route.params.room,
          type: 'command',
          command: 'startApprovalPollFromNominations',
        });
        return;
      }

      this.START_APPROVAL_POLL_FROM_NOMINATIONS();
    },

    closePoll() {
      if (this.isControllerWindow) {
        postMovieNightControllerMessage({
          room: this.$route.params.room,
          type: 'command',
          command: 'closePoll',
        });
        return;
      }

      this.CLOSE_POLL();
    },

    clearPoll() {
      if (this.isControllerWindow) {
        postMovieNightControllerMessage({
          room: this.$route.params.room,
          type: 'command',
          command: 'clearPoll',
        });
        return;
      }

      this.CLEAR_POLL();
    },

    startRunoff(limit) {
      if (this.isControllerWindow) {
        postMovieNightControllerMessage({
          room: this.$route.params.room,
          type: 'command',
          command: 'startPollRunoff',
          payload: { limit },
        });
        return;
      }

      this.START_POLL_RUNOFF(limit);
    },

    setCandidateApproval(candidate, approved) {
      this.SET_POLL_APPROVAL({
        candidateId: candidate.id,
        approved: Boolean(approved),
      });
    },

    isCandidateApproved(candidate) {
      return this.currentApprovals
        .some((candidateId) => String(candidateId) === String(candidate.id));
    },

    isClosedLeadingCandidate(candidate) {
      return this.activePoll
        && this.activePoll.status === 'closed'
        && this.hasAnyApproval
        && candidate.approvalCount === this.maxApprovalCount;
    },

    getResultChipLabel(candidate) {
      if (!this.isClosedLeadingCandidate(candidate)) {
        return '';
      }

      return this.isTieForLead
        ? 'Tied'
        : 'Winner';
    },

    getResultChipColor(candidate) {
      if (!this.isClosedLeadingCandidate(candidate)) {
        return undefined;
      }

      return this.isTieForLead
        ? 'warning'
        : 'success';
    },

    getCandidateTypeLabel(candidate) {
      switch (candidate.type) {
        case 'movie':
          return 'Movie';

        case 'show':
        case 'series':
          return 'Show';

        case 'episode':
          return 'Episode';

        default:
          return 'Title';
      }
    },

    getCandidateIcon(candidate) {
      switch (candidate.type) {
        case 'movie':
          return 'local_movies';

        case 'show':
        case 'series':
          return 'live_tv';

        case 'episode':
          return 'slideshow';

        default:
          return 'theaters';
      }
    },

    isPlayableCandidate(candidate) {
      return candidate.type === 'movie' || candidate.type === 'episode';
    },

    playlistKey(candidate) {
      return candidate.machineIdentifier && candidate.ratingKey
        ? `plex:${candidate.machineIdentifier}:${candidate.ratingKey}`
        : null;
    },

    isCandidateInPlaylist(candidate) {
      if (!candidate) {
        return false;
      }

      const key = this.playlistKey(candidate);
      return key
        ? this.IS_IN_PLAYLIST(key)
        : false;
    },

    addTopResultToPlaylist() {
      if (!this.canAddTopResultToPlaylist || this.isCandidateInPlaylist(this.topResult)) {
        return;
      }

      if (this.isControllerWindow) {
        postMovieNightControllerMessage({
          room: this.$route.params.room,
          type: 'command',
          command: 'addPlexPlaylistItem',
          payload: this.topResult,
        });
        return;
      }

      this.ADD_PLEX_PLAYLIST_ITEM(this.topResult);
    },
  },
};
</script>
