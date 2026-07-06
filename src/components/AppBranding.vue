<template>
  <div :class="containerClasses">
    <v-img
      contain
      :max-width="imageSize"
      :max-height="imageSize"
      :width="imageSize"
      :height="imageSize"
      :src="brandingImageUrl"
      :class="imageClass"
    />
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

export default {
  name: 'AppBranding',

  props: {
    center: {
      type: Boolean,
      default: true,
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

  computed: {
    ...mapGetters([
      'GET_CONFIG',
    ]),

    containerClasses() {
      return [
        'd-flex',
        'align-center',
        this.center ? 'justify-center' : null,
      ].filter(Boolean);
    },

    brandingImageUrl() {
      const configuredImage = this.GET_CONFIG?.branding_image_url;
      return typeof configuredImage === 'string' && configuredImage.trim()
        ? configuredImage.trim()
        : defaultBrandingImage;
    },

    brandingName() {
      const configuredName = this.GET_CONFIG?.branding_name;
      return typeof configuredName === 'string' && configuredName.trim()
        ? configuredName.trim()
        : 'MovieNight';
    },
  },
};
</script>
