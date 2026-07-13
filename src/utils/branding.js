export const DEFAULT_BRANDING_NAME = 'MovieNight';

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
