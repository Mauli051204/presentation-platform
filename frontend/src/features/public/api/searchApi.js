import axiosInstance from '@/services/axiosInstance';

export const getAutocomplete = (type, q) =>
  axiosInstance.get('/search/autocomplete', { params: { type, q } });
export const getPopularSearches = (type) =>
  axiosInstance.get('/search/popular', { params: { type } });
export const getRecentSearches = (type) =>
  axiosInstance.get('/search/recent', { params: { type } });
