import axiosInstance from '@/services/axiosInstance';

export const searchPresentersPublic = (params) => axiosInstance.get('/presenters', { params });
export const searchCollegesPublic = (params) => axiosInstance.get('/colleges', { params });
export const searchRequirementsPublic = (params) => axiosInstance.get('/requirements', { params });
