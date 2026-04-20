import api from './api';

export async function fetchUserPreferences(email) {
  if (!email) {
    return {};
  }

  const response = await api.get('/user_preferences', {
    params: { email },
  });

  return response?.data?.preferences || {};
}

export async function saveUserPreferences(email, preferencesPatch) {
  if (!email || !preferencesPatch || typeof preferencesPatch !== 'object') {
    return null;
  }

  const response = await api.post('/user_preferences', {
    email,
    preferences: preferencesPatch,
  });

  return response?.data || null;
}
