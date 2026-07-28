// Ten weighted checks, each worth 10% — gives a granular "profile strength"
// score for public display, distinct from the stricter isProfileComplete
// boolean gate that only checks the 4 fields required to apply for jobs.
export const calculatePresenterCompleteness = (profile) => {
  const checks = [
    Boolean(profile.headline),
    Boolean(profile.bio),
    (profile.skills || []).length > 0,
    (profile.education || []).length > 0,
    Boolean(profile.resume?.url),
    Boolean(profile.profileImage?.url),
    (profile.videos || []).length > 0,
    (profile.certificates || []).length > 0,
    (profile.availability || []).length > 0,
    (profile.languages || []).length > 0,
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};
