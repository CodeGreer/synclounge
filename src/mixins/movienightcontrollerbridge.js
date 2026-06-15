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

    handleMovieNightControllerHostMessage(message) {
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

        default:
          break;
      }
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
        },
      });
    },
  },
};
