import axiosInstance from '@/services/axiosInstance';

export const registerUser = (payload) => axiosInstance.post('/auth/register', payload);
export const loginUser = (payload) => axiosInstance.post('/auth/login', payload);
export const logoutUser = () => axiosInstance.post('/auth/logout');
export const fetchCurrentUser = () => axiosInstance.get('/auth/me');
export const forgotPassword = (email) => axiosInstance.post('/auth/forgot-password', { email });
export const resetPassword = (payload) => axiosInstance.post('/auth/reset-password', payload);
export const verifyEmail = (token) => axiosInstance.get(`/auth/verify-email?token=${token}`);
