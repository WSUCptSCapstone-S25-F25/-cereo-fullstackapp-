const LOCAL_PENDING_PREFERENCES_KEY = 'atlas_pending_user_preferences_v1';

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function deepMergePreferences(base = {}, overlay = {}) {
  const safeBase = isPlainObject(base) ? base : {};
  const safeOverlay = isPlainObject(overlay) ? overlay : {};

  const merged = { ...safeBase };
  Object.keys(safeOverlay).forEach((key) => {
    const baseValue = safeBase[key];
    const overlayValue = safeOverlay[key];

    if (isPlainObject(baseValue) && isPlainObject(overlayValue)) {
      merged[key] = deepMergePreferences(baseValue, overlayValue);
    } else {
      merged[key] = overlayValue;
    }
  });

  return merged;
}

export function hasPreferenceValues(preferences) {
  if (!isPlainObject(preferences)) {
    return false;
  }
  return Object.keys(preferences).length > 0;
}

export function readPendingLocalPreferences() {
  try {
    const raw = localStorage.getItem(LOCAL_PENDING_PREFERENCES_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    const prefs = parsed?.preferences;
    return isPlainObject(prefs) ? prefs : {};
  } catch (error) {
    console.warn('[Preferences] Failed to read local preferences cache:', error);
    return {};
  }
}

export function writePendingLocalPreferences(preferences) {
  try {
    const safePreferences = isPlainObject(preferences) ? preferences : {};
    const mergedPreferences = deepMergePreferences(
      readPendingLocalPreferences(),
      safePreferences
    );
    localStorage.setItem(
      LOCAL_PENDING_PREFERENCES_KEY,
      JSON.stringify({
        preferences: mergedPreferences,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.warn('[Preferences] Failed to write local preferences cache:', error);
  }
}

export function clearPendingLocalPreferences() {
  try {
    localStorage.removeItem(LOCAL_PENDING_PREFERENCES_KEY);
  } catch (error) {
    console.warn('[Preferences] Failed to clear local preferences cache:', error);
  }
}
