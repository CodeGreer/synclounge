export const DEFAULT_BRANDING_NAME = 'Sync-A-Rama';
export const DEFAULT_BRANDING_IMAGE_SIZE = 56;

export const normalizeBrandingName = (value) => (
  typeof value === 'string' && value.trim()
    ? value.trim()
    : DEFAULT_BRANDING_NAME
);

export const normalizeBrandingImageUrl = (value, fallbackImage) => (
  typeof value === 'string' && value.trim()
    ? value.trim()
    : fallbackImage
);

export const normalizeOptionalBoolean = (value) => {
  if (value === true || value === 1) {
    return true;
  }

  if (value === false || value === 0) {
    return false;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  return null;
};

export const resolveBrandingShowName = (locationValue, globalValue) => {
  const normalizedLocation = normalizeOptionalBoolean(locationValue);
  if (normalizedLocation !== null) {
    return normalizedLocation;
  }

  const normalizedGlobal = normalizeOptionalBoolean(globalValue);
  if (normalizedGlobal !== null) {
    return normalizedGlobal;
  }

  return true;
};

export const normalizeBrandingImageSize = (value, fallback = DEFAULT_BRANDING_IMAGE_SIZE) => {
  const fallbackValue = `${fallback}px`;

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0
      ? `${value}px`
      : fallbackValue;
  }

  if (typeof value !== 'string') {
    return fallbackValue;
  }

  const normalized = value.trim();
  if (!normalized) {
    return fallbackValue;
  }

  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return `${normalized}px`;
  }

  if (/^\d+(?:\.\d+)?(?:px|rem|em|vh|vw|vmin|vmax|%)$/.test(normalized)) {
    return normalized;
  }

  return fallbackValue;
};
