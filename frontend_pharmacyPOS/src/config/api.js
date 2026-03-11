const trimTrailingSlash = (value = '') => String(value).replace(/\/+$/, '');
const ensureLeadingSlash = (value = '') => (value.startsWith('/') ? value : `/${value}`);

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const rawUploadsUrl = (import.meta.env.VITE_UPLOADS_URL || '').trim();
const normalizedApiUrl = trimTrailingSlash(rawApiUrl);
const apiUrlHasApiSuffix = /\/api$/i.test(normalizedApiUrl);

export const API_ORIGIN = normalizedApiUrl
  ? trimTrailingSlash(normalizedApiUrl.replace(/\/api$/i, ''))
  : '';

export const API_BASE_URL = normalizedApiUrl
  ? (apiUrlHasApiSuffix ? normalizedApiUrl : `${normalizedApiUrl}/api`)
  : '/api';

export const UPLOADS_BASE_URL = rawUploadsUrl
  ? trimTrailingSlash(rawUploadsUrl)
  : (API_ORIGIN ? `${API_ORIGIN}/uploads` : '/uploads');

const normalizeApiPath = (path = '') => {
  const normalizedPath = ensureLeadingSlash(path);
  if (normalizedPath === '/' || normalizedPath.toLowerCase() === '/api') {
    return '';
  }
  return normalizedPath.replace(/^\/api(?=\/|$)/i, '');
};

const normalizeUploadPath = (path = '') => {
  const normalizedPath = ensureLeadingSlash(path);
  if (normalizedPath === '/' || normalizedPath.toLowerCase() === '/uploads') {
    return '';
  }
  return normalizedPath.replace(/^\/uploads(?=\/|$)/i, '');
};

export const toApiUrl = (path = '') => `${API_BASE_URL}${normalizeApiPath(path)}`;

export const toUploadUrl = (path = '') => `${UPLOADS_BASE_URL}${normalizeUploadPath(path)}`;
