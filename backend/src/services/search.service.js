import SearchLog from '../models/SearchLog.js';

export const logSearch = async ({ userId = null, query, type }) => {
  if (!query || !query.trim()) return;
  try {
    await SearchLog.create({ user: userId, query: query.trim(), type });
  } catch (error) {
    console.error(`[search] Failed to log search: ${error.message}`);
  }
};

export const parseListQuery = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const parseCsvParam = (value) =>
  value
    ? value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
