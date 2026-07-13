import {
  normalizeBrandingImageUrl,
  normalizeBrandingName,
  resolveBrandingShowName,
} from '@/utils/branding';
import defaultBrandingImage from '@/assets/images/logos/logo-small-light.png';

export default {
  GET_RELEASE_URL: (state) => `${state.repositoryUrl}/releases/tag/v${state.version}`,
  GET_BACKGROUND: (state) => state.background,
  GET_UP_NEXT_POST_PLAY_DATA: (state) => state.upNextPostPlayData,
  GET_CONFIG: (state) => state.configuration,
  GET_BRANDING_NAME: (state) => normalizeBrandingName(state.configuration?.branding_name),
  GET_BRANDING_IMAGE_URL: (state) => normalizeBrandingImageUrl(
    state.configuration?.branding_image_url,
    defaultBrandingImage,
  ),
  GET_BRANDING_SHOW_NAME: (state) => (locationKey) => resolveBrandingShowName(
    state.configuration?.[locationKey],
    state.configuration?.branding_show_name,
  ),
  GET_ACTIVE_METADATA: (state) => state.activeMetadata,
  GET_SNACKBAR_MESSAGE: (state) => state.snackbarMessage,
  GET_SNACKBAR_OPEN: (state) => state.snackbarOpen,
  GET_NAVIGATE_TO_PLAYER: (state) => state.navigateToPlayer,
  GET_BROWSER: (state) => state.browser,
  GET_NAVIGATE_HOME: (state) => state.navigateHome,
  IS_LIBRARY_LIST_VIEW: (state) => state.isLibraryListView,
};
