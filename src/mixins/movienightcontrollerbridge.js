import {
  createMovieNightControllerChannel,
  movieNightControllerMessageSource,
  postMovieNightControllerMessage,
} from '@/utils/movienightcontrollerchannel';

export default {
  data: () => ({
    movieNightControllerChannel: null,
  }),

  computed: {
    isMovieNightControllerWindow() {
      return this.$route.query.controller === '1';
    },

    movieNightControllerRoom() {
      return this.$route.params.room || this.$store.getters['synclounge/GET_ROOM'];
    },

    canReceiveMovieNightControllerCommands() {
      return !this.isMovieNightControllerWindow
        && this.$store.getters['synclounge/IS_IN_ROOM']
        && this.$store.getters['synclounge/AM_I_HOST'];
    },

    shouldUseMovieNightControllerChannel() {
      return Boolean(this.movieNightControllerRoom)
        && (this.isMovieNightControllerWindow || this.canReceiveMovieNightControllerCommands);
    },

    movieNightControllerNominations() {
      return this.$store.getters['movienight/GET_NOMINATIONS'];
    },

    movieNightControllerPlaylist() {
      return this.$store.getters['movienight/GET_PLAYLIST'];
    },

    movieNightControllerPlaylistVisibility() {
      return this.$store.getters['movienight/GET_PLAYLIST_VISIBILITY'];
    },

    movieNightControllerPlaylistAutoPlay() {
      return this.$store.getters['movienight/GET_PLAYLIST_AUTO_PLAY'];
    },
  },

  watch: {
    shouldUseMovieNightControllerChannel() {
      this.resetMovieNightControllerChannel();
    },

    movieNightControllerRoom() {
      this.resetMovieNightControllerChannel();
    },

    movieNightControllerNominations: {
      deep: true,
      handler() {
        this.broadcastMovieNightControllerState();
      },
    },

    movieNightControllerPlaylist: {
      deep: true,
      handler() {
        this.broadcastMovieNightControllerState();
      },
    },

    movieNightControllerPlaylistVisibility() {
      this.broadcastMovieNightControllerState();
    },

    movieNightControllerPlaylistAutoPlay() {
      this.broadcastMovieNightControllerState();
    },
  },

  mounted() {
    this.resetMovieNightControllerChannel();
  },

  beforeDestroy() {
    this.closeMovieNightControllerChannel();
  },

  methods: {
    resetMovieNightControllerChannel() {
      this.closeMovieNightControllerChannel();

      if (!this.shouldUseMovieNightControllerChannel) {
        return;
      }

      this.movieNightControllerChannel = createMovieNightControllerChannel(
        this.movieNightControllerRoom,
      );

      if (!this.movieNightControllerChannel) {
        return;
      }

      this.movieNightControllerChannel.addEventListener(
        'message',
        this.handleMovieNightControllerMessage,
      );

      if (this.isMovieNightControllerWindow) {
        postMovieNightControllerMessage({
          room: this.movieNightControllerRoom,
          type: 'stateRequest',
        });
      } else {
        this.broadcastMovieNightControllerState();
      }
    },

    closeMovieNightControllerChannel() {
      if (!this.movieNightControllerChannel) {
        return;
      }

      this.movieNightControllerChannel.removeEventListener(
        'message',
        this.handleMovieNightControllerMessage,
      );
      this.movieNightControllerChannel.close();
      this.movieNightControllerChannel = null;
    },

    handleMovieNightControllerMessage(event) {
      const message = event.data || {};

      if (message.source !== movieNightControllerMessageSource) {
        return;
      }

      if (this.isMovieNightControllerWindow) {
        this.handleMovieNightControllerStateMessage(message);
        return;
      }

      this.handleMovieNightControllerHostMessage(message);
    },

    handleMovieNightControllerStateMessage({ type, payload }) {
      if (type !== 'movieNightState') {
        return;
      }

      this.$store.commit('movienight/SET_MOVIENIGHT_STATE', payload);
    },

    async handleMovieNightControllerHostMessage(message) {
      if (!this.canReceiveMovieNightControllerCommands) {
        return;
      }

      if (message.type === 'stateRequest') {
        this.broadcastMovieNightControllerState();
        return;
      }

      if (message.type !== 'command') {
        return;
      }

      switch (message.command) {
        case 'addPlexNomination':
          this.$store.dispatch('movienight/ADD_PLEX_NOMINATION', message.payload);
          break;

        case 'addPlexPlaylistItem':
          this.$store.dispatch('movienight/ADD_PLEX_PLAYLIST_ITEM', message.payload);
          break;

        case 'removeNomination':
          this.$store.dispatch('movienight/REMOVE_NOMINATION', message.payload.id);
          break;

        case 'removePlaylistItem':
          this.$store.dispatch('movienight/REMOVE_PLAYLIST_ITEM', message.payload.id);
          break;

        case 'movePlaylistItemUp':
          this.$store.dispatch('movienight/MOVE_PLAYLIST_ITEM_UP', message.payload.id);
          break;

        case 'movePlaylistItemDown':
          this.$store.dispatch('movienight/MOVE_PLAYLIST_ITEM_DOWN', message.payload.id);
          break;

        case 'clearPlaylist':
          this.$store.dispatch('movienight/CLEAR_PLAYLIST');
          break;

        case 'setPlaylistVisibility':
          this.$store.dispatch('movienight/SET_PLAYLIST_VISIBILITY', message.payload.visibility);
          break;

        case 'setPlaylistAutoPlay':
          this.$store.dispatch(
            'movienight/SET_PLAYLIST_AUTO_PLAY',
            message.payload.playlistAutoPlay,
          );
          break;

        case 'playPlaylistItem':
          await this.playMovieNightControllerPlaylistItem(message.payload.item);
          break;

        case 'playAndRemovePlaylistItem':
          await this.playMovieNightControllerPlaylistItem(message.payload.item);
          this.$store.dispatch('movienight/REMOVE_PLAYLIST_ITEM', message.payload.item.id);
          break;

        default:
          break;
      }
    },

    async playMovieNightControllerPlaylistItem(item) {
      const metadata = await this.$store.dispatch('plexservers/FETCH_PLEX_METADATA', {
        ratingKey: item.ratingKey,
        machineIdentifier: item.machineIdentifier,
      });

      await this.$store.dispatch('plexclients/PLAY_MEDIA', {
        metadata,
        mediaIndex: 0,
        machineIdentifier: metadata.machineIdentifier,
        offset: 0,
        userInitiated: true,
      });
    },

    broadcastMovieNightControllerState() {
      if (!this.movieNightControllerChannel || !this.canReceiveMovieNightControllerCommands) {
        return;
      }

      this.movieNightControllerChannel.postMessage({
        source: movieNightControllerMessageSource,
        type: 'movieNightState',
        payload: {
          nominations: this.movieNightControllerNominations,
          playlist: this.movieNightControllerPlaylist,
          playlistVisibility: this.movieNightControllerPlaylistVisibility,
          playlistAutoPlay: this.movieNightControllerPlaylistAutoPlay,
        },
      });
    },
  },
};
