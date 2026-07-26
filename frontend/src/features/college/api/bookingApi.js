import axiosInstance from '@/services/axiosInstance';

export const createBooking = (payload) => axiosInstance.post('/bookings', payload);
export const getMyBookings = (params) => axiosInstance.get('/bookings/mine', { params });
export const getBookingById = (id) => axiosInstance.get(`/bookings/${id}`);
export const updateMeetingLink = (id, meetingLink) =>
  axiosInstance.patch(`/bookings/${id}/meeting-link`, { meetingLink });
export const completeBooking = (id) => axiosInstance.patch(`/bookings/${id}/complete`);
export const cancelBooking = (id, reason) =>
  axiosInstance.patch(`/bookings/${id}/cancel`, { reason });
