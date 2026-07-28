import PresenterProfile from '../models/PresenterProfile.js';
import SkillEndorsement from '../models/SkillEndorsement.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

export const getEndorsementsForPresenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await PresenterProfile.findById(id).select('skills');
    if (!profile) return next(new ApiError(404, 'Presenter not found'));

    const endorsements = await SkillEndorsement.find({ presenter: id });

    const countsBySkill = {};
    (profile.skills || []).forEach((s) => {
      countsBySkill[s] = 0;
    });
    endorsements.forEach((e) => {
      countsBySkill[e.skill] = (countsBySkill[e.skill] || 0) + 1;
    });

    let endorsedByMe = [];
    if (req.user) {
      endorsedByMe = endorsements
        .filter((e) => e.endorsedBy.toString() === req.user._id.toString())
        .map((e) => e.skill);
    }

    const skills = Object.entries(countsBySkill).map(([skill, count]) => ({ skill, count }));

    return res
      .status(200)
      .json(new ApiResponse(200, { skills, endorsedByMe }, 'Endorsements fetched'));
  } catch (error) {
    next(error);
  }
};

export const toggleEndorsement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { skill } = req.body;

    const profile = await PresenterProfile.findById(id).populate('user', '_id');
    if (!profile) return next(new ApiError(404, 'Presenter not found'));

    if (profile.user._id.toString() === req.user._id.toString()) {
      return next(new ApiError(400, 'You cannot endorse your own profile'));
    }

    if (!profile.skills.includes(skill)) {
      return next(new ApiError(400, "This skill is not listed on the presenter's profile"));
    }

    const existing = await SkillEndorsement.findOne({
      presenter: id,
      skill,
      endorsedBy: req.user._id,
    });

    if (existing) {
      await existing.deleteOne();
      return res.status(200).json(new ApiResponse(200, { endorsed: false }, 'Endorsement removed'));
    }

    await SkillEndorsement.create({
      presenter: id,
      skill,
      endorsedBy: req.user._id,
      endorserRole: req.user.role,
    });

    return res.status(201).json(new ApiResponse(201, { endorsed: true }, 'Skill endorsed'));
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(409, 'Already endorsed'));
    }
    next(error);
  }
};
