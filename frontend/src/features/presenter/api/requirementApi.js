import axiosInstance from '@/services/axiosInstance';

export const searchRequirements = (params) => axiosInstance.get('/requirements', { params });
export const getRequirementById = (id) => axiosInstance.get(`/requirements/${id}`);
