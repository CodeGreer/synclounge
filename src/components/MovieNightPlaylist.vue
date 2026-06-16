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
      v-if="canManagePlaylist"
      dense
      hide-details
      outlined
      class="mb-2"
      label="Visibility"
      :items="visibilityItems"
      :value="GET_PLAYLIST_VISIBILITY"
      @change="setPlaylistVisibility"
    />

    <v-switch
      v-if="canManagePlaylist"
      dense
      hide-details
      inset
      class="mb-2"
      label="Auto-play playlist"
      :input-value="GET_PLAYLIST_AUTO_PLAY"
      @change="setPlaylistAutoPlay"
    />

    <v-btn
      v-if="canManagePlaylist && playlist.length"
      small
      text
      block
      class="mb-3"
      @click="clearPlaylist"
    >
      <v-icon
        small
        left
      >
        clear_all
      </v-icon>
      Clear Playlist
    </v-btn>

    <v-alert
      v-if="!canManagePlaylist && GET_PLAYLIST_VISIBILITY === 'private'"
      dense
      text
      type="info"
    >
      The host is managing the playlist privately.
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
          <v-list-item-title class="d-flex align-center">
            <v-chip
              v-if="isActivePlaylistItem(item)"
              x-small
              color="primary"
              class="mr-2 flex-shrink-0"
            >
              Now
            </v-chip>
            <span class="text-truncate">
              {{ item.title }}
            </span>
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ getItemTypeLabel(item) }}
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn
            v-if="canManagePlaylist"
            icon
            small
            title="Play"
            @click="playPlaylistItem(item)"
          >
            <v-icon small>
              play_arrow
            </v-icon>
          </v-btn>

          <v-btn
            v-if="canManagePlaylist"
            icon
            small
            title="Play & Remove"
            @click="playAndRemovePlaylistItem(item)"
          >
            <v-icon small>
              playlist_remove
            </v-icon>
          </v-btn>

          <v-btn
            v-if="!canManagePlaylist"
            icon
            small
            title="Open"
            @click="openItem(item)"
          >
            <v-icon small>
              open_in_new
            </v-icon>
          </v-btn>

          <v-menu
            v-if="canManagePlaylist"
            offset-y
            left
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                small
                title="More"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon small>
                  more_vert
                </v-icon>
              </v-btn>
            </template>

            <v-list dense>
              <v-list-item @click="openItem(item)">
                <v-list-item-icon>
                  <v-icon small>
                    open_in_new
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Open
                </v-list-item-title>
              </v-list-item>

              <v-list-item
                :disabled="index === 0"
                @click="movePlaylistItemUp(item)"
              >
                <v-list-item-icon>
                  <v-icon small>
                    keyboard_arrow_up
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Move up
                </v-list-item-title>
              </v-list-item>

              <v-list-item
                :disabled="index === playlist.length - 1"
                @click="movePlaylistItemDown(item)"
              >
                <v-list-item-icon>
                  <v-icon small>
                    keyboard_arrow_down
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Move down
                </v-list-item-title>
              </v-list-item>

              <v-list-item @click="removePlaylistItem(item)">
                <v-list-item-icon>
                  <v-icon small>
                    close
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Remove
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-list-item-action>
      </v-list-item>
    </v-list>

    <div
      v-else
      class="text--secondary"
    >
      {{ emptyPlaylistMessage }}
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import playMedia from '@/mixins/playmedia';
import { postMovieNightControllerMessage } from '@/utils/movienightcontrollerchannel';

export default {
  name: 'MovieNightPlaylist',

  mixins: [
    playMedia,
  ],

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
      'GET_PLAYLIST_AUTO_PLAY',
      'GET_ACTIVE_PLAYLIST_ITEM',
    ]),

    playlist() {
      return this.GET_PLAYLIST;
    },

    isControllerWindow() {
      return this.$route.query.controller === '1';
    },

    canManagePlaylist() {
      return this.AM_I_HOST || this.isControllerWindow;
    },

    visiblePlaylist() {
      if (this.canManagePlaylist || this.GET_PLAYLIST_VISIBILITY === 'public') {
        return this.playlist;
      }

      if (this.GET_PLAYLIST_VISIBILITY === 'next') {
        return this.playlist.slice(0, 1);
      }

      return [];
    },

    emptyPlaylistMessage() {
      if (this.canManagePlaylist) {
        return 'No playlist items yet. Add movies or episodes from search, '
          + 'library pages, or nominations.';
      }

      if (this.GET_PLAYLIST_VISIBILITY === 'next') {
        return 'The host is building the playlist. You will see the next shared item here.';
      }

      return 'No playlist items are currently shared.';
    },
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_PLEX_METADATA',
    ]),

    ...mapActions('movienight', [
      'CLEAR_PLAYLIST',
      'MOVE_PLAYLIST_ITEM_DOWN',
      'MOVE_PLAYLIST_ITEM_UP',
      'REMOVE_PLAYLIST_ITEM',
      'SET_PLAYLIST_VISIBILITY',
      'SET_PLAYLIST_AUTO_PLAY',
      'SET_ACTIVE_PLAYLIST_ITEM',
    ]),

    isActivePlaylistItem(item) {
      const activeItem = this.GET_ACTIVE_PLAYLIST_ITEM;

      return activeItem && activeItem.id === item.id;
    },

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

    async getPlaylistItemMetadata(item) {
      return this.FETCH_PLEX_METADATA({
        ratingKey: item.ratingKey,
        machineIdentifier: item.machineIdentifier,
      });
    },

    sendControllerCommand(command, payload = {}) {
      return postMovieNightControllerMessage({
        room: this.$route.params.room,
        type: 'command',
        command,
        payload,
      });
    },

    setPlaylistVisibility(visibility) {
      if (this.isControllerWindow) {
        this.sendControllerCommand('setPlaylistVisibility', { visibility });
        return;
      }

      this.SET_PLAYLIST_VISIBILITY(visibility);
    },

    setPlaylistAutoPlay(playlistAutoPlay) {
      if (this.isControllerWindow) {
        this.sendControllerCommand('setPlaylistAutoPlay', { playlistAutoPlay });
        return;
      }

      this.SET_PLAYLIST_AUTO_PLAY(playlistAutoPlay);
    },

    clearPlaylist() {
      if (this.isControllerWindow) {
        this.sendControllerCommand('clearPlaylist');
        return;
      }

      this.CLEAR_PLAYLIST();
    },

    movePlaylistItemUp(item) {
      if (this.isControllerWindow) {
        this.sendControllerCommand('movePlaylistItemUp', { id: item.id });
        return;
      }

      this.MOVE_PLAYLIST_ITEM_UP(item.id);
    },

    movePlaylistItemDown(item) {
      if (this.isControllerWindow) {
        this.sendControllerCommand('movePlaylistItemDown', { id: item.id });
        return;
      }

      this.MOVE_PLAYLIST_ITEM_DOWN(item.id);
    },

    removePlaylistItem(item) {
      if (this.isControllerWindow) {
        this.sendControllerCommand('removePlaylistItem', { id: item.id });
        return;
      }

      this.REMOVE_PLAYLIST_ITEM(item.id);
    },

    async playPlaylistItem(item) {
      if (this.isControllerWindow) {
        this.sendControllerCommand('playPlaylistItem', { item });
        return;
      }

      await this.SET_ACTIVE_PLAYLIST_ITEM(item);

      const metadata = await this.getPlaylistItemMetadata(item);

      await this.playMedia(metadata, 0, 0);
    },

    async playAndRemovePlaylistItem(item) {
      if (this.isControllerWindow) {
        this.sendControllerCommand('playAndRemovePlaylistItem', { item });
        return;
      }

      await this.playPlaylistItem(item);
      await this.REMOVE_PLAYLIST_ITEM(item.id);
    },

    openItem(item) {
      this.$router.push({
        name: 'PlexMedia',
        params: {
          room: this.$route.params.room,
          machineIdentifier: item.machineIdentifier,
          ratingKey: item.ratingKey,
        },
        ...(this.isControllerWindow && {
          query: {
            controller: '1',
          },
        }),
      });
    },
  },
};
</script>
