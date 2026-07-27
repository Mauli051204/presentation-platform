import axiosInstance from '@/services/axiosInstance';

export const applyToRequirement = (payload) => axiosInstance.post('/applications', payload);
export const withdrawApplication = (applicationId, reason) =>
  axiosInstance.patch(`/applications/${applicationId}/withdraw`, { reason });
export const getMyApplications = (params) => axiosInstance.get('/applications/mine', { params });
