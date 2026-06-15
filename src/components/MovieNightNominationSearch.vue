<template>
  <v-autocomplete
    dense
    :items="items"
    :loading="loading"
    :search-input.sync="query"
    prepend-icon="search"
    no-filter
    clearable
    hide-details
    hide-no-data
    solo
    label="Search Plex titles"
    :menu-props="{ maxHeight: '60vh', maxWidth: '500px' }"
  >
    <template #item="{ item, on, attrs }">
      <template v-if="item.serverHeader">
        <v-list-item
          class="secondary"
          dense
          v-bind="attrs"
          v-on="on"
        >
          <v-subheader>
            {{ item.serverHeader }}
          </v-subheader>
        </v-list-item>
      </template>

      <template v-else-if="item.hubHeader">
        <v-list-item
          dense
          class="search-header"
          v-bind="attrs"
          v-on="on"
        >
          <v-subheader class="text-overline">
            {{ item.hubHeader }}
          </v-subheader>
        </v-list-item>
      </template>

      <template v-else>
        <v-list-item
          dense
          v-bind="attrs"
          v-on="on"
          @click="nominate(item)"
        >
          <v-list-item-avatar
            height="42"
            tile
          >
            <v-img
              contain
              :src="getImgUrl(item)"
            />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>
              {{ getTitle(item) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ getItemSecondaryTitle(item) }}
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action v-if="isNominated(item)">
            <v-icon color="primary">
              check
            </v-icon>
          </v-list-item-action>
        </v-list-item>
      </template>
    </template>
  </v-autocomplete>
</template>

<script>
import { CAF } from 'caf';
import { mapActions, mapGetters } from 'vuex';
import contentTitle from '@/mixins/contentTitle';
import { postMovieNightControllerMessage } from '@/utils/movienightcontrollerchannel';

const debounceTime = 250;
const nominatableTypes = ['movie', 'show', 'series', 'episode'];

export default {
  name: 'MovieNightNominationSearch',

  mixins: [
    contentTitle,
  ],

  data: () => ({
    loading: false,
    items: [],
    query: null,
    abortController: null,
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_CONNECTABLE_PLEX_SERVER_IDS',
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
    ]),

    ...mapGetters('movienight', [
      'IS_NOMINATED',
    ]),

    isControllerWindow() {
      return this.$route.query.controller === '1';
    },
  },

  watch: {
    query() {
      return this.searchServers();
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'SEARCH_PLEX_SERVER_HUB',
    ]),

    ...mapActions('movienight', [
      'ADD_PLEX_NOMINATION',
    ]),

    nominationKey(item) {
      return item.machineIdentifier && item.ratingKey
        ? `plex:${item.machineIdentifier}:${item.ratingKey}`
        : null;
    },

    isNominated(item) {
      const key = this.nominationKey(item);
      return key
        ? this.IS_NOMINATED(key)
        : false;
    },

    isNominatable(item) {
      return nominatableTypes.includes(item.type);
    },

    nominate(item) {
      if (!this.isNominatable(item)) {
        return;
      }

      if (this.isControllerWindow) {
        postMovieNightControllerMessage({
          room: this.$route.params.room,
          type: 'command',
          command: 'addPlexNomination',
          payload: item,
        });
      } else {
        this.ADD_PLEX_NOMINATION(item);
      }

      this.clear();
    },

    getItemSecondaryTitle(item) {
      return item.reason
        ? this.getReasonTitle(item)
        : this.getSecondaryTitle(item);
    },

    getItemThumb({ type, thumb, grandparentThumb }) {
      switch (type) {
        case 'movie':
          return thumb;

        case 'episode':
          return grandparentThumb;

        case 'series':
          return thumb;

        default:
          return thumb;
      }
    },

    getImgUrl(item) {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: item.machineIdentifier,
        mediaUrl: this.getItemThumb(item),
        width: 28,
        height: 42,
      });
    },

    abortRequests() {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    },

    clear() {
      this.abortRequests();
      this.query = null;
      this.items = [];
      this.loading = false;
    },

    addServerResults(machineIdentifier, serverResults) {
      const movieHubs = serverResults
        .map((hub) => ({
          ...hub,
          Metadata: hub.Metadata.filter((item) => this.isNominatable(item)),
        }))
        .filter((hub) => hub.Metadata.length);

      if (!movieHubs.length) {
        return;
      }

      this.items.push({
        serverHeader: this.GET_PLEX_SERVER(machineIdentifier).name,
        disabled: true,
      });

      this.items.push(...movieHubs.flatMap(({ Metadata, title }) => [{
        hubHeader: title,
        disabled: true,
      }].concat(Metadata)));
    },

    async searchServersCriticalSection(signal) {
      await Promise.all(this.GET_CONNECTABLE_PLEX_SERVER_IDS.map(async (machineIdentifier) => {
        const serverResults = await this.SEARCH_PLEX_SERVER_HUB({
          query: this.query,
          machineIdentifier,
          signal,
        });

        this.addServerResults(machineIdentifier, serverResults);
      }));

      this.loading = false;
    },

    async searchServersDebounced(signal) {
      await CAF.delay(signal, debounceTime);
      await this.searchServersCriticalSection(signal);
    },

    async searchServers() {
      this.abortRequests();

      this.items = [];
      if (!this.query || !this.query.trim()) {
        this.loading = false;
        return;
      }

      this.loading = true;

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.searchServersDebounced(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },
  },
};
</script>
