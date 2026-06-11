<template>
  <div>
    <v-divider class="my-3" />

    <div class="d-flex align-center mb-2">
      <v-icon
        small
        class="mr-2"
      >
        playlist_play
      </v-icon>

      <div class="text-subtitle-2">
        Host Playlist
      </div>
    </div>

    <v-select
      v-if="AM_I_HOST"
      dense
      hide-details
      outlined
      class="mb-3"
      label="Visibility"
      :items="visibilityItems"
      :value="GET_PLAYLIST_VISIBILITY"
      @change="SET_PLAYLIST_VISIBILITY"
    />

    <v-alert
      v-if="!AM_I_HOST && GET_PLAYLIST_VISIBILITY === 'private'"
      dense
      text
      type="info"
    >
      The host is managing the playlist.
    </v-alert>

    <v-list
      v-else-if="visiblePlaylist.length"
      dense
      color="transparent"
    >
      <v-list-item
        v-for="(item, index) in visiblePlaylist"
        :key="item.id"
      >
        <v-list-item-icon>
          <v-icon>{{ getItemIcon(item) }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>
            {{ item.title }}
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ getItemTypeLabel(item) }}
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn
            icon
            small
            title="Open"
            @click="openItem(item)"
          >
            <v-icon small>
              open_in_new
            </v-icon>
          </v-btn>

          <template v-if="AM_I_HOST">
            <v-btn
              icon
              small
              title="Move up"
              :disabled="index === 0"
              @click="MOVE_PLAYLIST_ITEM_UP(item.id)"
            >
              <v-icon small>
                keyboard_arrow_up
              </v-icon>
            </v-btn>

            <v-btn
              icon
              small
              title="Move down"
              :disabled="index === playlist.length - 1"
              @click="MOVE_PLAYLIST_ITEM_DOWN(item.id)"
            >
              <v-icon small>
                keyboard_arrow_down
              </v-icon>
            </v-btn>

            <v-btn
              icon
              small
              title="Remove"
              @click="REMOVE_PLAYLIST_ITEM(item.id)"
            >
              <v-icon small>
                close
              </v-icon>
            </v-btn>
          </template>
        </v-list-item-action>
      </v-list-item>
    </v-list>

    <div
      v-else
      class="text--secondary"
    >
      No playlist items yet.
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'MovieNightPlaylist',

  data: () => ({
    visibilityItems: [
      {
        text: 'Private',
        value: 'private',
      },
      {
        text: 'Next only',
        value: 'next',
      },
      {
        text: 'Public',
        value: 'public',
      },
    ],
  }),

  computed: {
    ...mapGetters('synclounge', [
      'AM_I_HOST',
    ]),

    ...mapGetters('movienight', [
      'GET_PLAYLIST',
      'GET_PLAYLIST_VISIBILITY',
    ]),

    playlist() {
      return this.GET_PLAYLIST;
    },

    visiblePlaylist() {
      if (this.AM_I_HOST || this.GET_PLAYLIST_VISIBILITY === 'public') {
        return this.playlist;
      }

      if (this.GET_PLAYLIST_VISIBILITY === 'next') {
        return this.playlist.slice(0, 1);
      }

      return [];
    },
  },

  methods: {
    ...mapActions('movienight', [
      'MOVE_PLAYLIST_ITEM_DOWN',
      'MOVE_PLAYLIST_ITEM_UP',
      'REMOVE_PLAYLIST_ITEM',
      'SET_PLAYLIST_VISIBILITY',
    ]),

    getItemTypeLabel(item) {
      switch (item.type) {
        case 'movie':
          return 'Movie';

        case 'episode':
          return 'Episode';

        default:
          return 'Title';
      }
    },

    getItemIcon(item) {
      switch (item.type) {
        case 'movie':
          return 'local_movies';

        case 'episode':
          return 'slideshow';

        default:
          return 'theaters';
      }
    },

    openItem(item) {
      this.$router.push({
        name: 'PlexMedia',
        params: {
          room: this.$route.params.room,
          machineIdentifier: item.machineIdentifier,
          ratingKey: item.ratingKey,
        },
      });
    },
  },
};
</script>
