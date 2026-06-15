const linkWithRoom = (getters, { params = {}, query, ...rest }) => {
  const room = params.room || getters['synclounge/GET_ROOM'];
  const server = params.server || getters['synclounge/GET_SERVER'];

  return {
    ...rest,
    params: {
      ...params,
      room,
      ...(server && {
        server,
      }),
    },
    ...(query && { query }),
  };
};

export default linkWithRoom;
