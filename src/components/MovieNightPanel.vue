<template>
  <v-card
    class="mb-4"
    style="background: rgb(0 0 0 / 60%);"
  >
    <v-card-title>
      MovieNight
    </v-card-title>

    <v-card-subtitle>
      {{ showManualEntry ? 'Nominate titles for tonight.' : 'Current nominations' }}
    </v-card-subtitle>

    <v-card-text>
      <v-btn
        v-if="AM_I_HOST && !isControllerWindow"
        small
        outlined
        block
        class="mb-3"
        @click="openBrowserWindow"
      >
        <v-icon
          small
          left
        >
          open_in_new
        </v-icon>
        Open Host Controller
      </v-btn>

      <v-alert
        v-if="!showManualEntry"
        dense
        text
        type="info"
        class="mb-3"
      >
        Nominate Plex movies, shows, or episodes from search, browse, or detail pages.
      </v-alert>

      <MovieNightNominationSearch v-if="showManualEntry" />

      <v-list
        v-if="nominations.length"
        dense
        class="mt-4"
        color="transparent"
      >
        <v-list-item
          v-for="nomination in nominations"
          :key="nomination.id"
        >
          <v-list-item-icon>
            <v-icon>{{ getNominationIcon(nomination) }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>
              {{ nomination.title }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ getNominationTypeLabel(nomination) }}
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn
              v-if="canAddNominationToPlaylist(nomination)"
              icon
              small
              :title="getPlaylistButtonTitle(nomination)"
              :disabled="isNominationInPlaylist(nomination)"
              @click="addNominationToPlaylist(nomination)"
            >
              <v-icon small>
                playlist_add
              </v-icon>
            </v-btn>

            <v-btn
              v-if="canOpenNomination(nomination)"
              icon
              small
              title="Open"
              @click="openNomination(nomination)"
            >
              <v-icon small>
                open_in_new
              </v-icon>
            </v-btn>

            <v-btn
              icon
              small
              title="Remove"
              @click="removeNomination(nomination.id)"
            >
              <v-icon small>
                close
              </v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <div
        v-else
        class="mt-4 text--secondary"
      >
        No nominations yet.
      </div>

      <MovieNightPlaylist />
    </v-card-text>
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import linkWithRoom from '@/mixins/linkwithroom';
import { postMovieNightControllerMessage } from '@/utils/movienightcontrollerchannel';

export default {
  name: 'MovieNightPanel',

  components: {
    MovieNightNominationSearch: () => import('@/components/MovieNightNominationSearch.vue'),
    MovieNightPlaylist: () => import('@/components/MovieNightPlaylist.vue'),
  },

  mixins: [
    linkWithRoom,
  ],

  props: {
    showManualEntry: {
      type: Boolean,
      default: true,
    },
  },

  computed: {
    ...mapGetters('synclounge', [
      'AM_I_HOST',
    ]),

    ...mapGetters('movienight', [
      'GET_NOMINATIONS',
      'IS_IN_PLAYLIST',
    ]),

    nominations() {
      return this.GET_NOMINATIONS;
    },

    isControllerWindow() {
      return this.$route.query.controller === '1';
    },

    canManageMovieNight() {
      return this.AM_I_HOST || this.isControllerWindow;
    },
  },

  methods: {
    ...mapActions('movienight', [
      'ADD_PLEX_PLAYLIST_ITEM',
      'REMOVE_NOMINATION',
    ]),
    getNominationTypeLabel(nomination) {
      switch (nomination.type) {
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

    getNominationIcon(nomination) {
      switch (nomination.type) {
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

    playlistKey(nomination) {
      return nomination.machineIdentifier && nomination.ratingKey
        ? `plex:${nomination.machineIdentifier}:${nomination.ratingKey}`
        : null;
    },

    isPlayableNomination(nomination) {
      return nomination.type === 'movie' || nomination.type === 'episode';
    },

    isNominationInPlaylist(nomination) {
      const key = this.playlistKey(nomination);
      return key
        ? this.IS_IN_PLAYLIST(key)
        : false;
    },

    getPlaylistButtonTitle(nomination) {
      return this.isNominationInPlaylist(nomination)
        ? 'Already in playlist'
        : 'Add to playlist';
    },

    canAddNominationToPlaylist(nomination) {
      return this.canManageMovieNight
        && this.isPlayableNomination(nomination)
        && this.canOpenNomination(nomination);
    },

    addNominationToPlaylist(nomination) {
      if (!this.canAddNominationToPlaylist(nomination)) {
        return;
      }

      if (this.isControllerWindow) {
        postMovieNightControllerMessage({
          room: this.$route.params.room,
          type: 'command',
          command: 'addPlexPlaylistItem',
          payload: nomination,
        });
        return;
      }

      this.ADD_PLEX_PLAYLIST_ITEM(nomination);
    },

    canOpenNomination(nomination) {
      return Boolean(nomination.machineIdentifier && nomination.ratingKey);
    },

    openNomination(nomination) {
      if (!this.canOpenNomination(nomination)) {
        return;
      }

      this.$router.push(this.linkWithRoom({
        name: 'PlexMedia',
        params: {
          machineIdentifier: nomination.machineIdentifier,
          ratingKey: nomination.ratingKey,
        },
      }));
    },

    openBrowserWindow() {
      const route = this.$router.resolve(this.linkWithRoom({
        name: 'PlexHome',
        query: {
          controller: '1',
        },
      }));

      window.open(route.href, 'movienight-browser', 'popup,width=1400,height=900');
    },

    removeNomination(id) {
      if (this.isControllerWindow) {
        postMovieNightControllerMessage({
          room: this.$route.params.room,
          type: 'command',
          command: 'removeNomination',
          payload: { id },
        });
        return;
      }

      this.REMOVE_NOMINATION(id);
    },
  },
};
</script>
