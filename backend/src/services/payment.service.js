import PresenterProfile from '../models/PresenterProfile.js';
import CollegeProfile from '../models/CollegeProfile.js';

export const assertBookingParticipant = async (booking, user) => {
  if (user.role === 'college') {
    const collegeProfile = await CollegeProfile.findOne({ user: user._id });
    return collegeProfile && booking.college.toString() === collegeProfile._id.toString();
  }
  if (user.role === 'presenter') {
    const presenterProfile = await PresenterProfile.findOne({ user: user._id });
    return presenterProfile && booking.presenter.toString() === presenterProfile._id.toString();
  }
  return false;
};
