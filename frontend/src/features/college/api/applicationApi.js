import axiosInstance from '@/services/axiosInstance';

export const getApplicationsForRequirement = (requirementId, params) =>
  axiosInstance.get(`/applications/requirement/${requirementId}`, { params });
export const updateApplicationStatus = (applicationId, status) =>
  axiosInstance.patch(`/applications/${applicationId}/status`, { status });
