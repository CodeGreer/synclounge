export default {
  GET_NOMINATIONS: (state) => state.nominations,

  IS_NOMINATED: (state) => (nominationKey) => state.nominations
    .some((nomination) => nomination.nominationKey === nominationKey),
};
