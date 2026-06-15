export const movieNightControllerMessageSource = 'movienight-controller';

export const getMovieNightControllerChannelName = (room) => (
  room
    ? `movienight-controller:${room}`
    : null
);

export const createMovieNightControllerChannel = (room) => {
  const channelName = getMovieNightControllerChannelName(room);

  if (!channelName || typeof BroadcastChannel === 'undefined') {
    return null;
  }

  return new BroadcastChannel(channelName);
};

export const postMovieNightControllerMessage = ({
  room, type, command, payload,
}) => {
  const channel = createMovieNightControllerChannel(room);

  if (!channel) {
    return false;
  }

  channel.postMessage({
    source: movieNightControllerMessageSource,
    type,
    command,
    payload,
  });

  setTimeout(() => channel.close(), 0);
  return true;
};
