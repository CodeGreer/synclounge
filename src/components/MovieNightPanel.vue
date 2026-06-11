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
    </v-card-text>
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'MovieNightPanel',

  components: {
    MovieNightNominationSearch: () => import('@/components/MovieNightNominationSearch.vue'),
  },

  props: {
    showManualEntry: {
      type: Boolean,
      default: true,
    },
  },

  computed: {
    ...mapGetters('movienight', [
      'GET_NOMINATIONS',
    ]),

    nominations() {
      return this.GET_NOMINATIONS;
    },
  },

  methods: {
    ...mapActions('movienight', [
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

    canOpenNomination(nomination) {
      return Boolean(nomination.machineIdentifier && nomination.ratingKey);
    },

    openNomination(nomination) {
      if (!this.canOpenNomination(nomination)) {
        return;
      }

      this.$router.push({
        name: 'PlexMedia',
        params: {
          room: this.$route.params.room,
          machineIdentifier: nomination.machineIdentifier,
          ratingKey: nomination.ratingKey,
        },
      });
    },

    removeNomination(id) {
      this.REMOVE_NOMINATION(id);
    },
  },
};
</script>
