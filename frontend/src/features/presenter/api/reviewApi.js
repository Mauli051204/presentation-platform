import axiosInstance from '@/services/axiosInstance';

export const submitReview = (payload) => axiosInstance.post('/reviews', payload);
