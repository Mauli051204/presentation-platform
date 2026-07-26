import axiosInstance from '@/services/axiosInstance';

export const getMyNotifications = (params) => axiosInstance.get('/notifications', { params });
export const markNotificationRead = (id) => axiosInstance.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => axiosInstance.patch('/notifications/read-all');
