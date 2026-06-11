<template>
  <v-card
    class="mb-4"
    style="background: rgb(0 0 0 / 60%);"
  >
    <v-card-title>
      MovieNight
    </v-card-title>

    <v-card-subtitle>
      Nominate movies for tonight.
    </v-card-subtitle>

    <v-card-text>
      <v-form @submit.prevent="addNomination">
        <v-row dense>
          <v-col
            cols="12"
            md="9"
          >
            <v-text-field
              v-model.trim="newNomination"
              label="Movie title"
              dense
              outlined
              hide-details
            />
          </v-col>

          <v-col
            cols="12"
            md="3"
          >
            <v-btn
              block
              color="primary"
              type="submit"
              :disabled="!canAddNomination"
            >
              Add
            </v-btn>
          </v-col>
        </v-row>
      </v-form>

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

  data: () => ({
    newNomination: '',
  }),

  computed: {
    ...mapGetters('movienight', [
      'GET_NOMINATIONS',
    ]),

    nominations() {
      return this.GET_NOMINATIONS;
    },

    canAddNomination() {
      return this.newNomination.length > 0;
    },
  },

  methods: {
    ...mapActions('movienight', [
      'ADD_NOMINATION',
      'REMOVE_NOMINATION',
    ]),

    addNomination() {
      if (!this.canAddNomination) {
        return;
      }

      this.ADD_NOMINATION({
        title: this.newNomination,
      });

      this.newNomination = '';
    },

    removeNomination(id) {
      this.REMOVE_NOMINATION(id);
    },
  },
};
</script>
