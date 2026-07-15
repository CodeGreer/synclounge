<template>
  <div
    :class="containerClasses"
    :role="showName ? null : 'img'"
    :aria-label="showName ? null : brandingName"
  >
    <img
      :src="displayImageUrl"
      :class="resolvedImageClasses"
      :style="imageStyles"
      alt=""
      aria-hidden="true"
      @error="useDefaultImage"
    >
    <span
      v-if="showName"
      :class="textClass"
      v-text="brandingName"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import defaultBrandingImage from '@/assets/images/logos/logo-small-light.png';
import { normalizeBrandingImageSize } from '@/utils/branding';

export default {
  name: 'AppBranding',

  props: {
    center: {
      type: Boolean,
      default: true,
    },

    fillWidth: {
      type: Boolean,
      default: false,
    },

    imageSize: {
      type: [Number, String],
      default: 56,
    },

    imageClass: {
      type: String,
      default: 'mr-3',
    },

    showName: {
      type: Boolean,
      default: true,
    },

    textClass: {
      type: String,
      default: 'display-1 font-weight-bold',
    },
  },

  data: () => ({
    imageLoadFailed: false,
  }),

  computed: {
    ...mapGetters([
      'GET_BRANDING_IMAGE_URL',
      'GET_BRANDING_NAME',
    ]),

    containerClasses() {
      return [
        'd-flex',
        'align-center',
        this.center ? 'justify-center' : null,
        this.fillWidth ? 'app-branding-fill-width' : null,
      ].filter(Boolean);
    },

    resolvedImageClasses() {
      return [
        'app-branding-image',
        this.showName ? this.imageClass : null,
      ].filter(Boolean);
    },

    brandingImageUrl() {
      return this.GET_BRANDING_IMAGE_URL;
    },

    displayImageUrl() {
      return this.imageLoadFailed ? defaultBrandingImage : this.brandingImageUrl;
    },

    imageStyles() {
      return {
        maxHeight: normalizeBrandingImageSize(this.imageSize),
      };
    },

    brandingName() {
      return this.GET_BRANDING_NAME;
    },
  },

  watch: {
    brandingImageUrl() {
      this.imageLoadFailed = false;
    },
  },

  methods: {
    useDefaultImage() {
      if (this.displayImageUrl !== defaultBrandingImage) {
        this.imageLoadFailed = true;
      }
    },
  },
};
</script>

<style scoped>
.app-branding-fill-width {
  width: 100%;
}

.app-branding-image {
  display: block;
  flex-shrink: 1;
  height: auto;
  max-width: 100%;
  min-width: 0;
  object-fit: contain;
  width: auto;
}
</style>
