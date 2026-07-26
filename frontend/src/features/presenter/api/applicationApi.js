import axiosInstance from '@/services/axiosInstance';

export const applyToRequirement = (payload) => axiosInstance.post('/applications', payload);
export const withdrawApplication = (applicationId) =>
  axiosInstance.patch(`/applications/${applicationId}/withdraw`);
export const getMyApplications = (params) => axiosInstance.get('/applications/mine', { params });
