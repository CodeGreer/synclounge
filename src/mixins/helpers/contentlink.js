import linkWithRoom from '@/mixins/helpers/linkwithroom';

const contentLink = (getters, {
  machineIdentifier, ratingKey, room, server, query,
}) => linkWithRoom(getters, {
  name: 'PlexMedia',
  params: {
    machineIdentifier,
    ratingKey,
    ...(room && { room }),
    ...(server && { server }),
  },
  query,
});

export default contentLink;
