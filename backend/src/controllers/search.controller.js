import PresenterProfile from '../models/PresenterProfile.js';
import Requirement from '../models/Requirement.js';
import SearchLog from '../models/SearchLog.js';
import ApiResponse from '../utils/ApiResponse.js';

export const autocomplete = async (req, res, next) => {
  try {
    const { type, q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json(new ApiResponse(200, [], 'Query too short'));
    }

    const regex = new RegExp(q.trim(), 'i');
    let suggestions = [];

    if (type === 'skill') {
      const results = await PresenterProfile.aggregate([
        { $unwind: '$skills' },
        { $match: { skills: regex } },
        { $group: { _id: '$skills' } },
        { $limit: 10 },
      ]);
      suggestions = results.map((r) => r._id);
    } else if (type === 'location') {
      const results = await PresenterProfile.aggregate([
        { $match: { 'location.city': regex } },
        { $group: { _id: '$location.city' } },
        { $limit: 10 },
      ]);
      suggestions = results.map((r) => r._id).filter(Boolean);
    } else {
      const results = await Requirement.aggregate([
        { $match: { title: regex, status: 'active' } },
        { $group: { _id: '$title' } },
        { $limit: 10 },
      ]);
      suggestions = results.map((r) => r._id);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, suggestions, 'Autocomplete suggestions fetched'));
  } catch (error) {
    next(error);
  }
};

export const getRecentSearches = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const recent = await SearchLog.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$query',
          lastSearchedAt: { $first: '$createdAt' },
          type: { $first: '$type' },
        },
      },
      { $sort: { lastSearchedAt: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, query: '$_id', type: 1, lastSearchedAt: 1 } },
    ]);

    return res.status(200).json(new ApiResponse(200, recent, 'Recent searches fetched'));
  } catch (error) {
    next(error);
  }
};

export const getPopularSearches = async (req, res, next) => {
  try {
    const { type } = req.query;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const match = { createdAt: { $gte: thirtyDaysAgo } };
    if (type) match.type = type;

    const popular = await SearchLog.aggregate([
      { $match: match },
      { $group: { _id: '$query', count: { $sum: 1 }, type: { $first: '$type' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, query: '$_id', count: 1, type: 1 } },
    ]);

    return res.status(200).json(new ApiResponse(200, popular, 'Popular searches fetched'));
  } catch (error) {
    next(error);
  }
};
