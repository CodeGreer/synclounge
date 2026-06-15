import linkWithRoom from '@/mixins/helpers/linkwithroom';

export default {
  methods: {
    linkWithRoom(params = {}) {
      const query = {
        ...params.query,
        ...(this.$route.query.controller === '1' && {
          controller: '1',
        }),
      };

      return linkWithRoom(this.$store.getters, {
        ...params,
        params: {
          ...(this.$route.params.room && {
            room: this.$route.params.room,
          }),
          ...(this.$route.params.server && {
            server: this.$route.params.server,
          }),
          ...params.params,
        },
        ...(Object.keys(query).length && { query }),
      });
    },
  },
};
