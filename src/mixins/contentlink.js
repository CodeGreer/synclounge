import contentLink from '@/mixins/helpers/contentlink';

export default {
  methods: {
    contentLink(params = {}) {
      const query = {
        ...params.query,
        ...(this.$route.query.controller === '1' && {
          controller: '1',
        }),
      };

      return contentLink(this.$store.getters, {
        ...params,
        ...(this.$route.params.room && {
          room: this.$route.params.room,
        }),
        ...(this.$route.params.server && {
          server: this.$route.params.server,
        }),
        ...(Object.keys(query).length && { query }),
      });
    },
  },
};
