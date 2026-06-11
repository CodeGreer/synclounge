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
            <v-icon>local_movies</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>
              {{ nomination.title }}
            </v-list-item-title>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn
              icon
              small
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
    removeNomination(id) {
      this.REMOVE_NOMINATION(id);
    },
  },
};
</script>
