import axiosInstance from '@/services/axiosInstance';

export const getMyRequirements = () => axiosInstance.get('/requirements/mine/all');
export const getRequirementById = (id) => axiosInstance.get(`/requirements/${id}`);
export const createRequirement = (payload) => axiosInstance.post('/requirements', payload);
export const updateRequirement = (id, payload) => axiosInstance.put(`/requirements/${id}`, payload);
export const updateRequirementStatus = (id, status) =>
  axiosInstance.patch(`/requirements/${id}/status`, { status });
export const deleteRequirement = (id) => axiosInstance.delete(`/requirements/${id}`);
