<template>
  <v-navigation-drawer
    app
    temporary
    :value="isLeftSidebarOpen"
    disable-route-watcher
    @input="SET_LEFT_SIDEBAR_OPEN"
  >
    <v-list-item v-if="GET_PLEX_USER">
      <v-list-item-avatar>
        <v-img
          :src="GET_PLEX_USER.thumb"
        />
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title style="font-weight: bold;">
          {{ GET_PLEX_USER.username }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider />

    <v-list
      dense
      nav
    >
      <template v-if="IS_IN_ROOM">
        <v-subheader>MovieNight</v-subheader>

        <v-list-item>
          <v-list-item-icon>
            <v-icon>meeting_room</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Room {{ GET_ROOM }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ AM_I_HOST ? 'You are the host' : `Host: ${hostName}` }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-list-item-icon>
            <v-icon>groups</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ participantCountText }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-divider />
      </template>

      <TheSettingsDialog v-slot="{ on, attrs }">
        <v-list-item
          v-bind="attrs"
          v-on="on"
        >
          <v-list-item-icon>
            <v-icon>settings</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </TheSettingsDialog>

      <v-list-item
        :router="true"
        :to="{ name: 'SignOut' }"
      >
        <v-list-item-icon>
          <v-icon>cancel</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>Sign out</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-subheader>About</v-subheader>

      <v-list-item
        :href="GET_RELEASE_URL"
        target="_blank"
      >
        <v-list-item-icon>
          <v-icon>info</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>MovieNight</v-list-item-title>
          <v-list-item-subtitle>Local build</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        :href="repositoryUrl"
        target="_blank"
      >
        <v-list-item-icon>
          <v-icon>code</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>GitHub</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex';

export default {
  name: 'TheSidebarLeft',

  components: {
    TheSettingsDialog: () => import('@/components/TheSettingsDialog.vue'),
  },

  computed: {
    ...mapState([
      'isLeftSidebarOpen',
      'version',
      'repositoryUrl',
    ]),

    ...mapGetters([
      'GET_RELEASE_URL',
    ]),

    ...mapGetters('plex', [
      'GET_PLEX_USER',
    ]),

    ...mapGetters('synclounge', [
      'AM_I_HOST',
      'GET_HOST_USER',
      'GET_ROOM',
      'GET_USERS',
      'IS_IN_ROOM',
    ]),

    hostName() {
      return this.GET_HOST_USER?.username || 'Unknown';
    },

    participantCount() {
      return Object.keys(this.GET_USERS).length;
    },

    participantCountText() {
      return this.participantCount === 1
        ? '1 person in room'
        : `${this.participantCount} people in room`;
    },
  },

  methods: {
    ...mapMutations([
      'SET_LEFT_SIDEBAR_OPEN',
    ]),
  },
};
</script>
