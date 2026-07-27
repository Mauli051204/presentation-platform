import axiosInstance from '@/services/axiosInstance';

export const getApplicationsForRequirement = (requirementId, params) =>
  axiosInstance.get(`/applications/requirement/${requirementId}`, { params });
export const updateApplicationStatus = (applicationId, status, reason) =>
  axiosInstance.patch(`/applications/${applicationId}/status`, { status, reason });
